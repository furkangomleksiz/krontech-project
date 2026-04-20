package com.krontech.api.pages.service;

import com.krontech.api.blog.dto.BlogCounterpartResponse;
import com.krontech.api.blog.dto.BlogDetailResponse;
import com.krontech.api.blog.dto.BlogListPublicResponse;
import com.krontech.api.blog.dto.BlogPreviewResponse;
import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.blog.repository.BlogPostRepository;
import com.krontech.api.blog.service.BlogHighlightService;
import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.pages.dto.PublicPageListItemResponse;
import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.products.dto.ProductDetailTabSectionResponse;
import com.krontech.api.products.dto.ProductResourcesIntroResponse;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.repository.ProductRepository;
import com.krontech.api.products.service.ProductPublicContentAssembler;
import com.krontech.api.resources.dto.ResourceResponse;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class PublicContentService {

    private final PageRepository pageRepository;
    private final BlogPostRepository blogPostRepository;
    private final BlogHighlightService blogHighlightService;
    private final ContentBlockRepository contentBlockRepository;
    private final ProductRepository productRepository;
    private final ProductPublicContentAssembler productPublicContentAssembler;
    private final ObjectStorageClient objectStorageClient;

    public PublicContentService(
            PageRepository pageRepository,
            BlogPostRepository blogPostRepository,
            BlogHighlightService blogHighlightService,
            ContentBlockRepository contentBlockRepository,
            ProductRepository productRepository,
            ProductPublicContentAssembler productPublicContentAssembler,
            ObjectStorageClient objectStorageClient
    ) {
        this.pageRepository = pageRepository;
        this.blogPostRepository = blogPostRepository;
        this.blogHighlightService = blogHighlightService;
        this.contentBlockRepository = contentBlockRepository;
        this.productRepository = productRepository;
        this.productPublicContentAssembler = productPublicContentAssembler;
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
     * Published CMS pages for a locale (admin Pages tab / {@code pages} table), excluding {@code home},
     * ordered by last update. Cached in Redis under {@code page-list}.
     */
    @Cacheable(value = "page-list", key = "#locale + ':' + #limit")
    public List<PublicPageListItemResponse> getPublishedPageList(String locale, int limit) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        var pageable = PageRequest.of(0, limit);
        var slice = pageRepository.findByLocaleAndStatusAndSlugNotOrderByUpdatedAtDesc(
                localeCode,
                PublishStatus.PUBLISHED,
                "home",
                pageable
        );
        return slice.getContent().stream().map(this::mapToPageListItem).toList();
    }

    private PublicPageListItemResponse mapToPageListItem(Page page) {
        String heroImageUrl = page.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(page.getHeroImageKey())
                : null;
        return new PublicPageListItemResponse(
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getTitle(),
                page.getSummary(),
                heroImageUrl,
                page.getPageType(),
                page.getPublishedAt()
        );
    }

    /**
     * Returns the published blog post list for the given locale.
     * Only the default page (index 0) response is cached under the {@code blog-list} cache
     * (TTL 10 min). Paginated requests beyond page 0 bypass the cache.
     * Evicted by {@link com.krontech.api.publishing.service.CacheService#evictContent}
     * on any blog post publish/unpublish transition.
     */
    @Cacheable(value = "blog-list", key = "#locale", condition = "#page == 0")
    public BlogListPublicResponse getBlogList(String locale, int page, int size) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        var pageable = PageRequest.of(page, size);

        org.springframework.data.domain.Page<BlogPost> result =
                blogPostRepository.findAllByLocaleAndStatusOrderByPublishedAtDesc(
                        localeCode, PublishStatus.PUBLISHED, pageable);

        List<BlogPreviewResponse> content =
                result.getContent().stream().map(this::mapToPreview).toList();

        return new BlogListPublicResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    /**
     * Curated sidebar posts for the public blog list and detail pages (published only, max five).
     * Cached in Redis under {@code blog-highlights} per locale; evicted with other blog caches.
     */
    @Cacheable(value = "blog-highlights", key = "#locale")
    public List<BlogPreviewResponse> getBlogHighlights(String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        return blogHighlightService.getPublishedPreviews(localeCode);
    }

    /**
     * Returns the published blog post detail for the given slug and locale.
     * Cached in Redis for 20 minutes under the {@code blog-detail} cache.
     * Evicted by {@link com.krontech.api.publishing.service.CacheService#evictContent}.
     */
    /**
     * Do not cache synthetic “not published” payloads — otherwise a miss is cached for 20 minutes and
     * publishing + locale-switch logic see stale “exists” state until TTL expires.
     */
    @Cacheable(
            value = "blog-detail",
            key = "#slug + ':' + #locale",
            unless = "#result.excerpt != null && #result.excerpt.equals('Fallback excerpt.')")
    public BlogDetailResponse getBlogDetail(String slug, String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        BlogPost post = blogPostRepository.findBySlugAndLocaleAndStatus(slug, localeCode, PublishStatus.PUBLISHED)
                .orElseGet(() -> buildFallbackPost(slug, localeCode));

        return mapToDetail(post);
    }

    /**
     * Resolves the published blog slug in {@code toLocale} that shares {@code contentGroupId} with the
     * post identified by ({@code slug}, {@code fromLocale}). Used by the site locale switcher when
     * translations use different URL slugs.
     */
    public Optional<BlogCounterpartResponse> getBlogCounterpart(String slug, String fromLocale, String toLocale) {
        LocaleCode from = LocaleCode.valueOf(fromLocale.toUpperCase());
        LocaleCode to = LocaleCode.valueOf(toLocale.toUpperCase());
        if (from == to) {
            return Optional.of(new BlogCounterpartResponse(slug));
        }
        return blogPostRepository
                .findBySlugAndLocaleAndStatus(slug, from, PublishStatus.PUBLISHED)
                .flatMap(post -> {
                    var groupId = post.getContentGroupId();
                    if (groupId == null) {
                        return Optional.empty();
                    }
                    return blogPostRepository.findByContentGroupIdAndLocaleAndStatus(groupId, to, PublishStatus.PUBLISHED);
                })
                .map(BlogPost::getSlug)
                .map(BlogCounterpartResponse::new);
    }

    private PublicPageResponse mapToPageResponse(Page page) {
        List<ContentBlockResponse> blocks = page.getId() == null
                ? List.of()
                : contentBlockRepository.findByPageOrderBySortOrderAsc(page).stream()
                        .map(this::mapBlock)
                        .toList();

        String heroImageUrl = page.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(page.getHeroImageKey())
                : null;

        List<ProductDetailTabSectionResponse> detailTabs = null;
        ProductResourcesIntroResponse resourcesIntro = null;
        List<ResourceResponse> linkedResources = null;
        Product productRow = resolveProduct(page);
        if (productRow != null) {
            var assembled = productPublicContentAssembler.assemble(productRow, true);
            detailTabs = assembled.detailTabs();
            resourcesIntro = assembled.resourcesIntro();
            linkedResources = assembled.linkedResources();
        }

        String body = page instanceof BlogPost bp ? bp.getBody() : null;

        return new PublicPageResponse(
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getTitle(),
                page.getSummary(),
                heroImageUrl,
                SeoMapper.toResponse(page.getSeo(), objectStorageClient),
                blocks,
                page.getPageType(),
                detailTabs,
                resourcesIntro,
                linkedResources,
                body
        );
    }

    private Product resolveProduct(Page page) {
        if (page instanceof Product p) {
            return p;
        }
        if ("product".equalsIgnoreCase(page.getPageType())) {
            return productRepository.findById(page.getId()).orElse(null);
        }
        return null;
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
