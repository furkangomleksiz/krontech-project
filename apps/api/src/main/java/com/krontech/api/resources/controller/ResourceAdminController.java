package com.krontech.api.resources.controller;

import com.krontech.api.resources.dto.ResourceAdminRequest;
import com.krontech.api.resources.dto.ResourceAdminResponse;
import com.krontech.api.resources.service.ResourceAdminService;
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
 * GET    /api/v1/admin/resources?locale=tr&status=DRAFT&resourceType=DATASHEET&page=0&size=20
 * GET    /api/v1/admin/resources/{id}
 * POST   /api/v1/admin/resources
 * PUT    /api/v1/admin/resources/{id}
 * PATCH  /api/v1/admin/resources/{id}/seo
 * DELETE /api/v1/admin/resources/{id}   — ADMIN only
 */
@RestController
@RequestMapping("/api/v1/admin/resources")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class ResourceAdminController {

    private final ResourceAdminService resourceAdminService;

    public ResourceAdminController(ResourceAdminService resourceAdminService) {
        this.resourceAdminService = resourceAdminService;
    }

    @GetMapping
    public Page<ResourceAdminResponse> list(
            @RequestParam(required = false) String locale,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceType,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return resourceAdminService.list(locale, status, resourceType, pageable);
    }

    @GetMapping("/{id}")
    public ResourceAdminResponse getById(@PathVariable UUID id) {
        return resourceAdminService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ResourceAdminResponse> create(@Valid @RequestBody ResourceAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceAdminService.create(request));
    }

    @PutMapping("/{id}")
    public ResourceAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ResourceAdminRequest request
    ) {
        return resourceAdminService.update(id, request);
    }

    @PatchMapping("/{id}/seo")
    public ResponseEntity<Void> updateSeo(
            @PathVariable UUID id,
            @Valid @RequestBody SeoRequest request
    ) {
        resourceAdminService.updateSeo(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        resourceAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
