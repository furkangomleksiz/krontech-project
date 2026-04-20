package com.krontech.api.blog.controller;

import com.krontech.api.blog.dto.BlogHighlightsAdminResponse;
import com.krontech.api.blog.dto.BlogHighlightsUpdateRequest;
import com.krontech.api.blog.service.BlogHighlightService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Curated blog sidebar (up to five posts per locale).
 *
 * <p>GET /api/v1/admin/blog/highlights?locale=en<br>
 * PUT /api/v1/admin/blog/highlights?locale=en — body {@code {"postIds":["uuid",...]}}
 */
@Validated
@RestController
@RequestMapping("/api/v1/admin/blog/highlights")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class BlogHighlightsAdminController {

    private final BlogHighlightService blogHighlightService;

    public BlogHighlightsAdminController(BlogHighlightService blogHighlightService) {
        this.blogHighlightService = blogHighlightService;
    }

    @GetMapping
    public BlogHighlightsAdminResponse get(
            @RequestParam @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return blogHighlightService.getAdmin(locale);
    }

    @PutMapping
    public BlogHighlightsAdminResponse put(
            @RequestParam @Pattern(regexp = "^(tr|en)$") String locale,
            @Valid @RequestBody BlogHighlightsUpdateRequest body
    ) {
        return blogHighlightService.replace(locale, body);
    }
}
