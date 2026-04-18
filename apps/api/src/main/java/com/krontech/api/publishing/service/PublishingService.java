package com.krontech.api.publishing.service;

import com.krontech.api.audit.service.AuditService;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.publishing.dto.PreviewTokenResponse;
import com.krontech.api.publishing.dto.PublishPageRequest;
import com.krontech.api.publishing.dto.PublishStateResponse;
import com.krontech.api.publishing.dto.SchedulePageRequest;
import com.krontech.api.publishing.dto.UnpublishPageRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Publishing state machine. Valid transitions:
 *
 *   DRAFT     → SCHEDULED  (via schedule)
 *   DRAFT     → PUBLISHED  (via publish)
 *   SCHEDULED → PUBLISHED  (via publish, or automatically by ScheduledPublishingService)
 *   SCHEDULED → DRAFT      (via unpublish)
 *   PUBLISHED → DRAFT      (via unpublish)
 *
 * All transitions write an audit log entry via AuditService and evict the relevant
 * Redis cache entries via CacheService.
 */
@Service
public class PublishingService {

    private final PageRepository pageRepository;
    private final CacheService cacheService;
    private final AuditService auditService;

    public PublishingService(
            PageRepository pageRepository,
            CacheService cacheService,
            AuditService auditService
    ) {
        this.pageRepository = pageRepository;
        this.cacheService = cacheService;
        this.auditService = auditService;
    }

    /**
     * Transitions a DRAFT or SCHEDULED page to PUBLISHED.
     * Records publishedAt and evicts the content cache.
     */
    public PublishStateResponse publish(PublishPageRequest request) {
        LocaleCode locale = LocaleCode.valueOf(request.locale().toUpperCase());
        Page page = findBySlugAndLocaleOrThrow(request.slug(), locale);

        if (page.getStatus() == PublishStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Page is already PUBLISHED. Unpublish it first to move it back to DRAFT.");
        }

        PublishStatus prev = page.getStatus();
        page.setStatus(PublishStatus.PUBLISHED);
        page.setPublishedAt(Instant.now());
        pageRepository.save(page);

        cacheService.evictContent(request.locale(), request.slug());
        auditService.record("PUBLISH", "PAGE", page.getId(), page.getSlug(),
                prev.name() + " → PUBLISHED");

        return toStateResponse(page);
    }

    /**
     * Transitions a DRAFT page to SCHEDULED with a future publish time.
     * The scheduled promotion is carried out by {@link ScheduledPublishingService}.
     */
    public PublishStateResponse schedule(SchedulePageRequest request) {
        LocaleCode locale = LocaleCode.valueOf(request.locale().toUpperCase());
        Page page = findBySlugAndLocaleOrThrow(request.slug(), locale);

        if (page.getStatus() != PublishStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only DRAFT pages can be scheduled. Current status: " + page.getStatus());
        }

        page.setStatus(PublishStatus.SCHEDULED);
        page.setScheduledAt(request.scheduledAt());
        pageRepository.save(page);

        auditService.record("SCHEDULE", "PAGE", page.getId(), page.getSlug(),
                "DRAFT → SCHEDULED for " + request.scheduledAt());

        return toStateResponse(page);
    }

    /**
     * Reverts a PUBLISHED or SCHEDULED page back to DRAFT.
     * Evicts the content cache so the page is no longer served publicly.
     */
    public PublishStateResponse unpublish(UnpublishPageRequest request) {
        LocaleCode locale = LocaleCode.valueOf(request.locale().toUpperCase());
        Page page = findBySlugAndLocaleOrThrow(request.slug(), locale);

        if (page.getStatus() == PublishStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Page is already in DRAFT status.");
        }

        PublishStatus prev = page.getStatus();
        page.setStatus(PublishStatus.DRAFT);
        pageRepository.save(page);

        cacheService.evictContent(request.locale(), request.slug());
        auditService.record("UNPUBLISH", "PAGE", page.getId(), page.getSlug(),
                prev.name() + " → DRAFT");

        return toStateResponse(page);
    }

    /**
     * Generates a new preview token for the given page, invalidating any previous token.
     * The token grants access to the page regardless of publish status via
     * {@code GET /api/v1/preview?token={token}}.
     */
    public PreviewTokenResponse rotatePreviewToken(UUID pageId) {
        Page page = pageRepository.findById(pageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found."));

        UUID token = UUID.randomUUID();
        page.setPreviewToken(token);
        pageRepository.save(page);

        auditService.record("ROTATE_PREVIEW_TOKEN", "PAGE", page.getId(), page.getSlug(),
                "New preview token issued.");

        return new PreviewTokenResponse(pageId, token, "/api/v1/preview?token=" + token);
    }

    /** Called by {@link ScheduledPublishingService} to promote a page that was already validated. */
    public void promoteToPublished(Page page) {
        page.setStatus(PublishStatus.PUBLISHED);
        page.setPublishedAt(Instant.now());
        pageRepository.save(page);

        cacheService.evictContent(page.getLocale().name().toLowerCase(), page.getSlug());
        auditService.record("SCHEDULED_PUBLISH", "PAGE", page.getId(), page.getSlug(),
                "SCHEDULED → PUBLISHED (auto-promoted by scheduler)");
    }

    private Page findBySlugAndLocaleOrThrow(String slug, LocaleCode locale) {
        return pageRepository.findBySlugAndLocale(slug, locale)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No page found for slug='" + slug + "' locale=" + locale.name()));
    }

    private PublishStateResponse toStateResponse(Page page) {
        return new PublishStateResponse(
                page.getId(),
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getStatus().name(),
                page.getPublishedAt(),
                page.getScheduledAt()
        );
    }
}
