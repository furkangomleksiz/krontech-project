package com.krontech.api.blog.service;

import com.krontech.api.blog.dto.BlogHighlightAdminItem;
import com.krontech.api.blog.dto.BlogHighlightsAdminResponse;
import com.krontech.api.blog.dto.BlogHighlightsUpdateRequest;
import com.krontech.api.blog.dto.BlogPreviewResponse;
import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.blog.entity.BlogSidebarHighlightSlot;
import com.krontech.api.blog.repository.BlogPostRepository;
import com.krontech.api.blog.repository.BlogSidebarHighlightSlotRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.publishing.service.CacheService;
import jakarta.transaction.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BlogHighlightService {

    private static final int MAX_HIGHLIGHTS = 5;

    private final BlogSidebarHighlightSlotRepository slotRepository;
    private final BlogPostRepository blogPostRepository;
    private final ObjectStorageClient objectStorageClient;
    private final CacheService cacheService;

    public BlogHighlightService(
            BlogSidebarHighlightSlotRepository slotRepository,
            BlogPostRepository blogPostRepository,
            ObjectStorageClient objectStorageClient,
            CacheService cacheService
    ) {
        this.slotRepository = slotRepository;
        this.blogPostRepository = blogPostRepository;
        this.objectStorageClient = objectStorageClient;
        this.cacheService = cacheService;
    }

    public BlogHighlightsAdminResponse getAdmin(String localeParam) {
        LocaleCode locale = parseLocale(localeParam);
        List<BlogHighlightAdminItem> posts = slotRepository.findByLocaleWithPostsOrdered(locale).stream()
                .map(BlogSidebarHighlightSlot::getBlogPost)
                .map(p -> new BlogHighlightAdminItem(
                        p.getId(),
                        p.getSlug(),
                        p.getTitle(),
                        p.getStatus().name()
                ))
                .toList();
        return new BlogHighlightsAdminResponse(locale.name().toLowerCase(Locale.ROOT), posts);
    }

    @Transactional
    public BlogHighlightsAdminResponse replace(String localeParam, BlogHighlightsUpdateRequest request) {
        LocaleCode locale = parseLocale(localeParam);
        List<UUID> ids = request.postIds();
        if (ids.size() > MAX_HIGHLIGHTS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "At most " + MAX_HIGHLIGHTS + " highlight posts are allowed.");
        }
        if (ids.size() != new HashSet<>(ids).size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate post IDs are not allowed.");
        }

        slotRepository.deleteByLocale(locale);
        slotRepository.flush();

        int order = 0;
        for (UUID postId : ids) {
            BlogPost post = blogPostRepository.findById(postId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Unknown blog post id: " + postId));
            if (post.getLocale() != locale) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Post '" + post.getSlug() + "' is for locale "
                                + post.getLocale().name().toLowerCase(Locale.ROOT)
                                + ", not "
                                + locale.name().toLowerCase(Locale.ROOT)
                                + ".");
            }

            BlogSidebarHighlightSlot slot = new BlogSidebarHighlightSlot();
            slot.setLocale(locale);
            slot.setSortOrder(order++);
            slot.setBlogPost(post);
            slotRepository.save(slot);
        }

        cacheService.evictBlogHighlights(locale.name().toLowerCase(Locale.ROOT));
        return getAdmin(localeParam);
    }

    /**
     * Published posts only, in configured order. Draft or missing rows are omitted.
     */
    public List<BlogPreviewResponse> getPublishedPreviews(LocaleCode locale) {
        return slotRepository.findByLocaleWithPostsOrdered(locale).stream()
                .map(BlogSidebarHighlightSlot::getBlogPost)
                .filter(p -> p.getStatus() == PublishStatus.PUBLISHED)
                .map(this::toPreview)
                .toList();
    }

    private BlogPreviewResponse toPreview(BlogPost post) {
        String heroImageUrl = post.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(post.getHeroImageKey())
                : null;
        return new BlogPreviewResponse(
                post.getSlug(),
                post.getLocale().name().toLowerCase(Locale.ROOT),
                post.getTitle(),
                post.getSummary(),
                heroImageUrl,
                post.getTags(),
                post.getReadTimeMinutes(),
                post.getPublishedAt()
        );
    }

    private static LocaleCode parseLocale(String locale) {
        try {
            return LocaleCode.valueOf(locale.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid locale: " + locale);
        }
    }
}
