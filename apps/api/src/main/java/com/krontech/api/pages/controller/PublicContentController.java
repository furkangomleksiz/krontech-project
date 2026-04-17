package com.krontech.api.pages.controller;

import com.krontech.api.blog.dto.BlogDetailResponse;
import com.krontech.api.blog.dto.BlogPreviewResponse;
import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.service.PublicContentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
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

    @GetMapping("/pages/{slug}")
    public PublicPageResponse getPage(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return publicContentService.getPage(slug, locale);
    }

    @GetMapping("/blog")
    public List<BlogPreviewResponse> getBlog(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        return publicContentService.getBlogList(locale, page, size);
    }

    @GetMapping("/blog/{slug}")
    public BlogDetailResponse getBlogDetail(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return publicContentService.getBlogDetail(slug, locale);
    }
}
