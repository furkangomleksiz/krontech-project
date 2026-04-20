package com.krontech.api.audit.controller;

import com.krontech.api.audit.dto.AuditLogResponse;
import com.krontech.api.audit.entity.AuditLog;
import com.krontech.api.audit.repository.AuditLogRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only audit trail. ADMIN and EDITOR may list entries (actor emails, action verbs).
 *
 * GET /api/v1/admin/audit?targetId={id}&action=PUBLISH&actor=editor@...&page=0&size=20
 */
@RestController
@RequestMapping("/api/v1/admin/audit")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class AuditAdminController {

    private final AuditLogRepository auditLogRepository;

    public AuditAdminController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> list(
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditLog> results;

        if (targetId != null) {
            results = auditLogRepository.findByTargetIdOrderByCreatedAtDesc(targetId, pageable);
        } else if (action != null) {
            results = auditLogRepository.findByActionOrderByCreatedAtDesc(action.toUpperCase(), pageable);
        } else if (actor != null) {
            results = auditLogRepository.findByActorOrderByCreatedAtDesc(actor, pageable);
        } else {
            results = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(results.map(this::toResponse));
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getCreatedAt(),
                log.getActor(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getTargetSlug(),
                log.getDetails()
        );
    }
}
