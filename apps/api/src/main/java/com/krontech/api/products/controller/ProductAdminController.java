package com.krontech.api.products.controller;

import com.krontech.api.products.dto.ProductAdminResponse;
import com.krontech.api.products.dto.ProductCreateRequest;
import com.krontech.api.products.dto.ProductUpdateRequest;
import com.krontech.api.products.service.ProductAdminService;
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
 * GET    /api/v1/admin/products?locale=tr&status=DRAFT&page=0&size=20
 * GET    /api/v1/admin/products/{id}
 * POST   /api/v1/admin/products
 * PUT    /api/v1/admin/products/{id}
 * PATCH  /api/v1/admin/products/{id}/seo
 * DELETE /api/v1/admin/products/{id}   — ADMIN only
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class ProductAdminController {

    private final ProductAdminService productAdminService;

    public ProductAdminController(ProductAdminService productAdminService) {
        this.productAdminService = productAdminService;
    }

    @GetMapping
    public Page<ProductAdminResponse> list(
            @RequestParam(required = false) String locale,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return productAdminService.list(locale, status, pageable);
    }

    @GetMapping("/{id}")
    public ProductAdminResponse getById(@PathVariable UUID id) {
        return productAdminService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ProductAdminResponse> create(@Valid @RequestBody ProductCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productAdminService.create(request));
    }

    @PutMapping("/{id}")
    public ProductAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        return productAdminService.update(id, request);
    }

    @PatchMapping("/{id}/seo")
    public ResponseEntity<Void> updateSeo(
            @PathVariable UUID id,
            @Valid @RequestBody SeoRequest request
    ) {
        productAdminService.updateSeo(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        productAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
