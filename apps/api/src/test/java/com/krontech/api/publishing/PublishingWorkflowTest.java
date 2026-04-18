package com.krontech.api.publishing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.audit.service.AuditService;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.dto.PreviewTokenResponse;
import com.krontech.api.publishing.dto.PublishStateResponse;
import com.krontech.api.publishing.dto.SchedulePageRequest;
import com.krontech.api.publishing.dto.UnpublishPageRequest;
import com.krontech.api.publishing.service.CacheService;
import com.krontech.api.publishing.service.PublishingService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

/**
 * Covers the full publishing state machine: schedule, unpublish, preview token,
 * invalid transitions, and audit recording.
 */
class PublishingWorkflowTest {

    private final PageRepository pageRepository = Mockito.mock(PageRepository.class);
    private final CacheService cacheService = Mockito.mock(CacheService.class);
    private final AuditService auditService = Mockito.mock(AuditService.class);
    private final PublishingService service = new PublishingService(pageRepository, cacheService, auditService);

    // ── schedule ───────────────────────────────────────────────────────────────

    @Test
    void shouldScheduleDraftPage() {
        Page page = draftPage("product-a", LocaleCode.TR);
        when(pageRepository.findBySlugAndLocale("product-a", LocaleCode.TR)).thenReturn(Optional.of(page));
        when(pageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Instant future = Instant.now().plusSeconds(3600);
        PublishStateResponse response = service.schedule(new SchedulePageRequest("product-a", "tr", future));

        assertEquals(PublishStatus.SCHEDULED, page.getStatus());
        assertEquals(future, page.getScheduledAt());
        assertEquals("SCHEDULED", response.status());
        verify(auditService).record(eq("SCHEDULE"), eq("PAGE"), any(), eq("product-a"), any());
    }

    @Test
    void shouldRejectSchedulingPublishedPage() {
        Page page = pageWithStatus("product-a", LocaleCode.TR, PublishStatus.PUBLISHED);
        when(pageRepository.findBySlugAndLocale("product-a", LocaleCode.TR)).thenReturn(Optional.of(page));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.schedule(new SchedulePageRequest("product-a", "tr", Instant.now().plusSeconds(100))));
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void shouldRejectSchedulingAlreadyScheduledPage() {
        Page page = pageWithStatus("product-a", LocaleCode.EN, PublishStatus.SCHEDULED);
        when(pageRepository.findBySlugAndLocale("product-a", LocaleCode.EN)).thenReturn(Optional.of(page));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.schedule(new SchedulePageRequest("product-a", "en", Instant.now().plusSeconds(100))));
        assertEquals(409, ex.getStatusCode().value());
    }

    // ── unpublish ──────────────────────────────────────────────────────────────

    @Test
    void shouldUnpublishPublishedPage() {
        Page page = pageWithStatus("blog-post-1", LocaleCode.EN, PublishStatus.PUBLISHED);
        when(pageRepository.findBySlugAndLocale("blog-post-1", LocaleCode.EN)).thenReturn(Optional.of(page));
        when(pageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PublishStateResponse response = service.unpublish(new UnpublishPageRequest("blog-post-1", "en"));

        assertEquals(PublishStatus.DRAFT, page.getStatus());
        assertEquals("DRAFT", response.status());
        verify(cacheService).evictContent("en", "blog-post-1");
        verify(auditService).record(eq("UNPUBLISH"), eq("PAGE"), any(), eq("blog-post-1"), any());
    }

    @Test
    void shouldUnpublishScheduledPage() {
        Page page = pageWithStatus("blog-post-2", LocaleCode.TR, PublishStatus.SCHEDULED);
        when(pageRepository.findBySlugAndLocale("blog-post-2", LocaleCode.TR)).thenReturn(Optional.of(page));
        when(pageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PublishStateResponse response = service.unpublish(new UnpublishPageRequest("blog-post-2", "tr"));

        assertEquals(PublishStatus.DRAFT, page.getStatus());
        verify(cacheService).evictContent("tr", "blog-post-2");
    }

    @Test
    void shouldRejectUnpublishingDraftPage() {
        Page page = draftPage("blog-post-3", LocaleCode.EN);
        when(pageRepository.findBySlugAndLocale("blog-post-3", LocaleCode.EN)).thenReturn(Optional.of(page));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.unpublish(new UnpublishPageRequest("blog-post-3", "en")));
        assertEquals(409, ex.getStatusCode().value());
    }

    // ── preview token ──────────────────────────────────────────────────────────

    @Test
    void shouldRotatePreviewToken() {
        Page page = draftPage("home", LocaleCode.EN);
        UUID pageId = UUID.randomUUID();
        when(pageRepository.findById(pageId)).thenReturn(Optional.of(page));
        when(pageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PreviewTokenResponse response = service.rotatePreviewToken(pageId);

        assertNotNull(response.token());
        assertNotNull(response.previewPath());
        assertEquals(pageId, response.pageId());
        verify(auditService).record(eq("ROTATE_PREVIEW_TOKEN"), eq("PAGE"), any(), any(), any());
    }

    @Test
    void shouldThrowNotFoundWhenRotatingTokenForMissingPage() {
        when(pageRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> service.rotatePreviewToken(UUID.randomUUID()));
    }

    // ── audit — negative: no audit on failed transitions ──────────────────────

    @Test
    void shouldNotWriteAuditOnConflictingPublish() {
        Page page = pageWithStatus("home", LocaleCode.EN, PublishStatus.PUBLISHED);
        when(pageRepository.findBySlugAndLocale("home", LocaleCode.EN)).thenReturn(Optional.of(page));

        assertThrows(ResponseStatusException.class,
                () -> service.publish(new com.krontech.api.publishing.dto.PublishPageRequest("home", "en")));

        verify(auditService, never()).record(any(), any(), any(), any(), any());
    }

    // ── promoteToPublished (scheduled promotion path) ─────────────────────────

    @Test
    void shouldPromoteToPublishedAndEvictCache() {
        Page page = pageWithStatus("report-2025", LocaleCode.EN, PublishStatus.SCHEDULED);
        when(pageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.promoteToPublished(page);

        assertEquals(PublishStatus.PUBLISHED, page.getStatus());
        assertNotNull(page.getPublishedAt());
        verify(cacheService).evictContent("en", "report-2025");
        verify(auditService).record(eq("SCHEDULED_PUBLISH"), eq("PAGE"), any(), eq("report-2025"), any());
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    static Page draftPage(String slug, LocaleCode locale) {
        Page page = new Page();
        page.setSlug(slug);
        page.setLocale(locale);
        page.setPageType("generic");
        page.setTitle("Test Page");
        page.setSummary("A test page.");
        page.setStatus(PublishStatus.DRAFT);
        return page;
    }

    static Page pageWithStatus(String slug, LocaleCode locale, PublishStatus status) {
        Page page = draftPage(slug, locale);
        page.setStatus(status);
        return page;
    }
}
