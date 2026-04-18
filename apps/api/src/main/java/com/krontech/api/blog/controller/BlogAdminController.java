package com.krontech.api.blog.controller;

import com.krontech.api.blog.dto.BlogAdminResponse;
import com.krontech.api.blog.dto.BlogCreateRequest;
import com.krontech.api.blog.dto.BlogUpdateRequest;
import com.krontech.api.blog.service.BlogAdminService;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET    /api/v1/admin/blog?locale=tr&status=DRAFT&page=0&size=20
 * GET    /api/v1/admin/blog/{id}
 * POST   /api/v1/admin/blog
 * PUT    /api/v1/admin/blog/{id}
 * PATCH  /api/v1/admin/blog/{id}/seo
 * DELETE /api/v1/admin/blog/{id}   — ADMIN only
 */
@RestController
@RequestMapping("/api/v1/admin/blog")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class BlogAdminController {

    private final BlogAdminService blogAdminService;

    public BlogAdminController(BlogAdminService blogAdminService) {
        this.blogAdminService = blogAdminService;
    }

    @GetMapping
    public Page<BlogAdminResponse> list(
            @RequestParam(required = false) String locale,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return blogAdminService.list(locale, status, pageable);
    }

    @GetMapping("/{id}")
    public BlogAdminResponse getById(@PathVariable UUID id) {
        return blogAdminService.getById(id);
    }

    @PostMapping
    public ResponseEntity<BlogAdminResponse> create(@Valid @RequestBody BlogCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blogAdminService.create(request));
    }

    @PutMapping("/{id}")
    public BlogAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody BlogUpdateRequest request
    ) {
        return blogAdminService.update(id, request);
    }

    @PatchMapping("/{id}/seo")
    public ResponseEntity<Void> updateSeo(
            @PathVariable UUID id,
            @Valid @RequestBody SeoRequest request
    ) {
        blogAdminService.updateSeo(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        blogAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
