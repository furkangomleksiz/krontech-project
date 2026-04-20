package com.krontech.api.pages.controller;

import com.krontech.api.blog.dto.BlogCounterpartResponse;
import com.krontech.api.blog.dto.BlogDetailResponse;
import com.krontech.api.blog.dto.BlogListPublicResponse;
import com.krontech.api.blog.dto.BlogPreviewResponse;
import com.krontech.api.pages.dto.PublicPageListItemResponse;
import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.service.PublicContentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/public")
public class PublicContentController {

    private final PublicContentService publicContentService;

    public PublicContentController(PublicContentService publicContentService) {
        this.publicContentService = publicContentService;
    }

    /**
     * Latest published CMS pages for a locale (same {@code pages} rows as the admin Pages tab,
     * excluding the {@code home} slug). Ordered by {@code updatedAt} descending.
     */
    @GetMapping("/pages")
    public List<PublicPageListItemResponse> listPublishedPages(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale,
            @RequestParam(defaultValue = "24") @Min(1) @Max(50) int limit
    ) {
        return publicContentService.getPublishedPageList(locale, limit);
    }

    @GetMapping("/pages/{slug}")
    public PublicPageResponse getPage(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return publicContentService.getPage(slug, locale);
    }

    @GetMapping("/blog")
    public BlogListPublicResponse getBlog(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return publicContentService.getBlogList(locale, page, size);
    }

    /** CMS-curated blog sidebar (published posts only, same order as configured). */
    @GetMapping("/blog/highlights")
    public List<BlogPreviewResponse> getBlogHighlights(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return publicContentService.getBlogHighlights(locale);
    }

    @GetMapping("/blog/{slug}")
    public BlogDetailResponse getBlogDetail(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return publicContentService.getBlogDetail(slug, locale);
    }

    /**
     * Published sibling slug for locale switching when TR/EN posts share a {@code contentGroupId}
     * but have different slugs.
     */
    @GetMapping("/blog/{slug}/counterpart")
    public BlogCounterpartResponse getBlogCounterpart(
            @PathVariable String slug,
            @RequestParam @Pattern(regexp = "^(tr|en)$") String fromLocale,
            @RequestParam @Pattern(regexp = "^(tr|en)$") String toLocale
    ) {
        return publicContentService
                .getBlogCounterpart(slug, fromLocale, toLocale)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No linked counterpart."));
    }
}
