package com.krontech.api.blog.service;

import com.krontech.api.blog.dto.BlogAdminResponse;
import com.krontech.api.blog.dto.BlogCreateRequest;
import com.krontech.api.blog.dto.BlogUpdateRequest;
import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.blog.repository.BlogPostRepository;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BlogAdminService {

    private final BlogPostRepository blogPostRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public BlogAdminService(
            BlogPostRepository blogPostRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.blogPostRepository = blogPostRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
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
        post.setHeroImageKey(request.heroImageKey());
        post.setBody(request.body());
        post.setTags(request.tags());
        post.setReadTimeMinutes(request.readTimeMinutes());
        post.setStatus(PublishStatus.DRAFT);
        post.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(post.getSeo(), request.seo());
        }
        return toResponse(blogPostRepository.save(post));
    }

    public BlogAdminResponse update(UUID id, BlogUpdateRequest request) {
        BlogPost post = findOrThrow(id);
        post.setTitle(request.title());
        post.setSummary(request.summary());
        post.setHeroImageKey(request.heroImageKey());
        post.setBody(request.body());
        post.setTags(request.tags());
        post.setReadTimeMinutes(request.readTimeMinutes());
        post.setContentGroupId(request.contentGroupId());
        post.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(post.getSeo(), request.seo());
        }
        return toResponse(blogPostRepository.save(post));
    }

    public void updateSeo(UUID id, SeoRequest request) {
        BlogPost post = findOrThrow(id);
        SeoMapper.applyRequest(post.getSeo(), request);
        blogPostRepository.save(post);
    }

    @Transactional
    public void delete(UUID id) {
        BlogPost post = findOrThrow(id);
        contentBlockRepository.deleteByPage(post);
        blogPostRepository.delete(post);
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
}
