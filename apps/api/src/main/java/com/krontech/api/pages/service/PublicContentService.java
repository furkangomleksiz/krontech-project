package com.krontech.api.pages.service;

import com.krontech.api.blog.dto.BlogDetailResponse;
import com.krontech.api.blog.dto.BlogPreviewResponse;
import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.blog.repository.BlogPostRepository;
import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class PublicContentService {

    private final PageRepository pageRepository;
    private final BlogPostRepository blogPostRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public PublicContentService(
            PageRepository pageRepository,
            BlogPostRepository blogPostRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.pageRepository = pageRepository;
        this.blogPostRepository = blogPostRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
    }

    /**
     * Returns the published page for the given slug and locale.
     * Result is cached in Redis for 10 minutes under the {@code pages} cache.
     * Evicted by {@link com.krontech.api.publishing.service.CacheService#evictContent}
     * on any publish/unpublish transition.
     */
    @Cacheable(value = "pages", key = "#slug + ':' + #locale")
    public PublicPageResponse getPage(String slug, String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        Page page = pageRepository.findBySlugAndLocaleAndStatus(slug, localeCode, PublishStatus.PUBLISHED)
                .orElseGet(() -> buildFallbackPage(slug, localeCode));

        return mapToPageResponse(page);
    }

    /**
     * Returns the published blog post list for the given locale.
     * Only the default page (index 0) response is cached under the {@code blog-list} cache
     * (TTL 10 min). Paginated requests beyond page 0 bypass the cache.
     * Evicted by {@link com.krontech.api.publishing.service.CacheService#evictContent}
     * on any blog post publish/unpublish transition.
     */
    @Cacheable(value = "blog-list", key = "#locale", condition = "#page == 0")
    public List<BlogPreviewResponse> getBlogList(String locale, int page, int size) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        var pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());

        return blogPostRepository.findByLocaleAndStatus(localeCode, PublishStatus.PUBLISHED, pageable)
                .stream()
                .map(this::mapToPreview)
                .toList();
    }

    /**
     * Returns the published blog post detail for the given slug and locale.
     * Cached in Redis for 20 minutes under the {@code blog-detail} cache.
     * Evicted by {@link com.krontech.api.publishing.service.CacheService#evictContent}.
     */
    @Cacheable(value = "blog-detail", key = "#slug + ':' + #locale")
    public BlogDetailResponse getBlogDetail(String slug, String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        BlogPost post = blogPostRepository.findBySlugAndLocaleAndStatus(slug, localeCode, PublishStatus.PUBLISHED)
                .orElseGet(() -> buildFallbackPost(slug, localeCode));

        return mapToDetail(post);
    }

    private PublicPageResponse mapToPageResponse(Page page) {
        List<ContentBlockResponse> blocks = contentBlockRepository
                .findByPageOrderBySortOrderAsc(page)
                .stream()
                .map(this::mapBlock)
                .toList();

        String heroImageUrl = page.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(page.getHeroImageKey())
                : null;

        return new PublicPageResponse(
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getTitle(),
                page.getSummary(),
                heroImageUrl,
                SeoMapper.toResponse(page.getSeo(), objectStorageClient),
                blocks
        );
    }

    private BlogPreviewResponse mapToPreview(BlogPost post) {
        String heroImageUrl = post.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(post.getHeroImageKey())
                : null;

        return new BlogPreviewResponse(
                post.getSlug(),
                post.getLocale().name().toLowerCase(),
                post.getTitle(),
                post.getSummary(),
                heroImageUrl,
                post.getTags(),
                post.getReadTimeMinutes(),
                post.getPublishedAt()
        );
    }

    private BlogDetailResponse mapToDetail(BlogPost post) {
        String heroImageUrl = post.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(post.getHeroImageKey())
                : null;

        return new BlogDetailResponse(
                post.getSlug(),
                post.getLocale().name().toLowerCase(),
                post.getTitle(),
                post.getSummary(),
                post.getBody(),
                heroImageUrl,
                post.getTags(),
                post.getReadTimeMinutes(),
                post.getPublishedAt(),
                SeoMapper.toResponse(post.getSeo(), objectStorageClient)
        );
    }

    private ContentBlockResponse mapBlock(ContentBlock block) {
        return new ContentBlockResponse(block.getBlockType(), block.getSortOrder(), block.getPayloadJson());
    }

    private Page buildFallbackPage(String slug, LocaleCode localeCode) {
        Page page = new Page();
        page.setSlug(slug);
        page.setLocale(localeCode);
        page.setPageType("generic");
        page.setTitle("Kron " + slug);
        page.setSummary("Fallback content — no published page found for this slug.");
        page.getSeo().setMetaTitle("Kron " + slug);
        page.getSeo().setMetaDescription("Fallback description.");
        page.getSeo().setCanonicalPath("/" + slug);
        return page;
    }

    private BlogPost buildFallbackPost(String slug, LocaleCode localeCode) {
        BlogPost post = new BlogPost();
        post.setSlug(slug);
        post.setLocale(localeCode);
        post.setPageType("blog-post");
        post.setTitle("Security article: " + slug);
        post.setSummary("Fallback excerpt.");
        post.setBody("Fallback body. No published post found for this slug.");
        return post;
    }
}
