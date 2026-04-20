package com.krontech.api.blog.service;

import com.krontech.api.audit.service.AuditService;
import com.krontech.api.blog.dto.BlogAdminResponse;
import com.krontech.api.blog.dto.BlogCreateRequest;
import com.krontech.api.blog.dto.BlogUpdateRequest;
import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.blog.repository.BlogPostRepository;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.publishing.service.CacheService;
import com.krontech.api.seo.SeoMapper;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.transaction.Transactional;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BlogAdminService {

    private final BlogPostRepository blogPostRepository;
    private final PageRepository pageRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;
    private final CacheService cacheService;
    private final AuditService auditService;

    public BlogAdminService(
            BlogPostRepository blogPostRepository,
            PageRepository pageRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient,
            CacheService cacheService,
            AuditService auditService
    ) {
        this.blogPostRepository = blogPostRepository;
        this.pageRepository = pageRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
        this.cacheService = cacheService;
        this.auditService = auditService;
    }

    public Page<BlogAdminResponse> list(String locale, String status, Pageable pageable) {
        LocaleCode localeCode = locale != null ? LocaleCode.valueOf(locale.toUpperCase()) : null;
        PublishStatus publishStatus = status != null ? PublishStatus.valueOf(status.toUpperCase()) : null;

        if (localeCode != null && publishStatus != null) {
            return blogPostRepository.findAllByLocaleAndStatus(localeCode, publishStatus, pageable).map(this::toResponse);
        } else if (localeCode != null) {
            return blogPostRepository.findAllByLocale(localeCode, pageable).map(this::toResponse);
        } else if (publishStatus != null) {
            return blogPostRepository.findAllByStatus(publishStatus, pageable).map(this::toResponse);
        }
        return blogPostRepository.findAll(pageable).map(this::toResponse);
    }

    public BlogAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public BlogAdminResponse create(BlogCreateRequest request) {
        LocaleCode localeCode = LocaleCode.valueOf(request.locale().toUpperCase());
        BlogPost post = new BlogPost();
        post.setPageType("blog-post");
        post.setSlug(request.slug());
        post.setLocale(localeCode);
        post.setContentGroupId(request.contentGroupId());
        post.setTitle(request.title());
        post.setSummary(request.summary());
        post.setHeroImageKey(trimKey(request.heroImageKey()));
        post.setBody(request.body());
        post.setTags(request.tags());
        post.setReadTimeMinutes(request.readTimeMinutes());
        post.setStatus(PublishStatus.DRAFT);
        post.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(post.getSeo(), request.seo());
        }
        BlogPost saved = blogPostRepository.save(post);
        cacheService.evictContent(saved.getLocale().name().toLowerCase(), saved.getSlug());
        cacheService.evictLinkedContentGroup(saved.getContentGroupId());
        auditService.record("CREATE", "BLOG_POST", saved.getId(), saved.getSlug(), null);
        return toResponse(saved);
    }

    public BlogAdminResponse update(UUID id, BlogUpdateRequest request) {
        BlogPost post = findOrThrow(id);
        String priorSlug = post.getSlug();
        LocaleCode priorLocale = post.getLocale();
        UUID priorContentGroupId = post.getContentGroupId();

        String newSlug = request.slug().strip();
        LocaleCode newLocale = LocaleCode.valueOf(request.locale().toUpperCase());
        if (pageRepository.existsBySlugAndLocaleAndIdNot(newSlug, newLocale, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another page already uses slug '" + newSlug + "' for locale " + newLocale.name().toLowerCase() + ".");
        }
        post.setSlug(newSlug);
        post.setLocale(newLocale);

        post.setTitle(request.title());
        post.setSummary(request.summary());
        post.setHeroImageKey(trimKey(request.heroImageKey()));
        post.setBody(request.body());
        post.setTags(request.tags());
        post.setReadTimeMinutes(request.readTimeMinutes());
        post.setContentGroupId(request.contentGroupId());
        post.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(post.getSeo(), request.seo());
        }
        BlogPost saved = blogPostRepository.save(post);
        cacheService.evictContent(priorLocale.name().toLowerCase(), priorSlug);
        if (!priorSlug.equals(saved.getSlug()) || priorLocale != saved.getLocale()) {
            cacheService.evictContent(saved.getLocale().name().toLowerCase(), saved.getSlug());
        }
        if (priorContentGroupId != null) {
            cacheService.evictLinkedContentGroup(priorContentGroupId);
        }
        UUID newContentGroupId = saved.getContentGroupId();
        if (newContentGroupId != null && !Objects.equals(priorContentGroupId, newContentGroupId)) {
            cacheService.evictLinkedContentGroup(newContentGroupId);
        }
        auditService.record("UPDATE", "BLOG_POST", saved.getId(), saved.getSlug(), null);
        return toResponse(saved);
    }

    public void updateSeo(UUID id, SeoRequest request) {
        BlogPost post = findOrThrow(id);
        SeoMapper.applyRequest(post.getSeo(), request);
        blogPostRepository.save(post);
        cacheService.evictContent(post.getLocale().name().toLowerCase(), post.getSlug());
        cacheService.evictLinkedContentGroup(post.getContentGroupId());
        auditService.record("UPDATE", "BLOG_POST", post.getId(), post.getSlug(), "SEO metadata");
    }

    @Transactional
    public void delete(UUID id) {
        BlogPost post = findOrThrow(id);
        String locale = post.getLocale().name().toLowerCase();
        String slug = post.getSlug();
        UUID postId = post.getId();
        UUID groupId = post.getContentGroupId();
        contentBlockRepository.deleteByPage(post);
        blogPostRepository.delete(post);
        cacheService.evictContent(locale, slug);
        cacheService.evictLinkedContentGroup(groupId);
        auditService.record("DELETE", "BLOG_POST", postId, slug, null);
    }

    private BlogPost findOrThrow(UUID id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog post not found."));
    }

    private BlogAdminResponse toResponse(BlogPost post) {
        return new BlogAdminResponse(
                post.getId(),
                post.getSlug(),
                post.getLocale().name().toLowerCase(),
                post.getContentGroupId(),
                post.getStatus().name(),
                post.getPublishedAt(),
                post.getScheduledAt(),
                post.getPreviewToken(),
                post.getTitle(),
                post.getSummary(),
                post.getHeroImageKey(),
                post.getBody(),
                post.getTags(),
                post.getReadTimeMinutes(),
                SeoMapper.toResponse(post.getSeo(), objectStorageClient),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private static String trimKey(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return key.strip();
    }
}
