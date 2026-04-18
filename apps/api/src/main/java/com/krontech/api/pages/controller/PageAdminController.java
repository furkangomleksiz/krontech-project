package com.krontech.api.pages.controller;

import com.krontech.api.components.dto.ContentBlockReplaceRequest;
import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.pages.dto.PageAdminResponse;
import com.krontech.api.pages.dto.PageCreateRequest;
import com.krontech.api.pages.dto.PageUpdateRequest;
import com.krontech.api.pages.service.PageAdminService;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.validation.Valid;
import java.util.List;
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
 * Admin CRUD for generic page records and their content blocks.
 * EDITOR and ADMIN can read, create, and update. DELETE requires ADMIN.
 *
 * GET    /api/v1/admin/pages?locale=tr&status=DRAFT&page=0&size=20
 * GET    /api/v1/admin/pages/{id}
 * POST   /api/v1/admin/pages
 * PUT    /api/v1/admin/pages/{id}
 * PATCH  /api/v1/admin/pages/{id}/seo
 * DELETE /api/v1/admin/pages/{id}         — ADMIN only
 * GET    /api/v1/admin/pages/{id}/blocks
 * PUT    /api/v1/admin/pages/{id}/blocks
 */
@RestController
@RequestMapping("/api/v1/admin/pages")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class PageAdminController {

    private final PageAdminService pageAdminService;

    public PageAdminController(PageAdminService pageAdminService) {
        this.pageAdminService = pageAdminService;
    }

    @GetMapping
    public Page<PageAdminResponse> list(
            @RequestParam(required = false) String locale,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return pageAdminService.list(locale, status, pageable);
    }

    @GetMapping("/{id}")
    public PageAdminResponse getById(@PathVariable UUID id) {
        return pageAdminService.getById(id);
    }

    @PostMapping
    public ResponseEntity<PageAdminResponse> create(@Valid @RequestBody PageCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pageAdminService.create(request));
    }

    @PutMapping("/{id}")
    public PageAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody PageUpdateRequest request
    ) {
        return pageAdminService.update(id, request);
    }

    @PatchMapping("/{id}/seo")
    public ResponseEntity<Void> updateSeo(
            @PathVariable UUID id,
            @Valid @RequestBody SeoRequest request
    ) {
        pageAdminService.updateSeo(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        pageAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/blocks")
    public List<ContentBlockResponse> getBlocks(@PathVariable UUID id) {
        return pageAdminService.getBlocks(id);
    }

    @PutMapping("/{id}/blocks")
    public List<ContentBlockResponse> replaceBlocks(
            @PathVariable UUID id,
            @Valid @RequestBody ContentBlockReplaceRequest request
    ) {
        return pageAdminService.replaceBlocks(id, request);
    }
}
