package com.krontech.api.redirects.controller;

import com.krontech.api.redirects.dto.RedirectRuleRequest;
import com.krontech.api.redirects.dto.RedirectRuleResponse;
import com.krontech.api.redirects.service.RedirectService;
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
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin management of redirect rules (EDITOR + ADMIN).
 *
 * <pre>
 * GET    /api/v1/admin/redirects?page=0&size=50   — paginated list (all statuses)
 * GET    /api/v1/admin/redirects/{id}
 * POST   /api/v1/admin/redirects                  — create rule
 * PUT    /api/v1/admin/redirects/{id}              — full update
 * PATCH  /api/v1/admin/redirects/{id}/toggle      — flip active flag
 * DELETE /api/v1/admin/redirects/{id}             — ADMIN only
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin/redirects")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class RedirectAdminController {

    private final RedirectService redirectService;

    public RedirectAdminController(RedirectService redirectService) {
        this.redirectService = redirectService;
    }

    @GetMapping
    public Page<RedirectRuleResponse> list(
            @PageableDefault(size = 50, sort = "sourcePath") Pageable pageable
    ) {
        return redirectService.list(pageable);
    }

    @GetMapping("/{id}")
    public RedirectRuleResponse getById(@PathVariable UUID id) {
        return redirectService.getById(id);
    }

    @PostMapping
    public ResponseEntity<RedirectRuleResponse> create(
            @Valid @RequestBody RedirectRuleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(redirectService.create(request));
    }

    @PutMapping("/{id}")
    public RedirectRuleResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody RedirectRuleRequest request
    ) {
        return redirectService.update(id, request);
    }

    /**
     * Toggles active → inactive or inactive → active without touching other fields.
     * Preferred over delete for temporarily disabling rules during rollouts.
     */
    @PatchMapping("/{id}/toggle")
    public RedirectRuleResponse toggle(@PathVariable UUID id) {
        return redirectService.toggle(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        redirectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
