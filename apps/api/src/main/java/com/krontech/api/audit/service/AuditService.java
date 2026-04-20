package com.krontech.api.audit.service;

import com.krontech.api.audit.entity.AuditLog;
import com.krontech.api.audit.repository.AuditLogRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper that records a structured audit entry.
 *
 * Actor resolution: reads the authenticated user's name from SecurityContextHolder.
 * Falls back to "system" for scheduled background operations that run without a user context.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records a single audit event.
     *
     * @param action     UPPER_SNAKE_CASE verb: CREATE, UPDATE, DELETE, PUBLISH, SCHEDULE, UNPUBLISH,
     *                   SCHEDULED_PUBLISH, ROTATE_PREVIEW_TOKEN
     * @param targetType content type label: PAGE, BLOG_POST, PRODUCT, RESOURCE
     * @param targetId   UUID of the affected entity row
     * @param targetSlug slug at the time of the event (for human-readable reports)
     * @param details    optional free-form context string (e.g. "DRAFT → PUBLISHED")
     */
    public void record(String action, String targetType, UUID targetId, String targetSlug, String details) {
        AuditLog log = new AuditLog();
        log.setActor(resolveActor());
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetSlug(targetSlug);
        // DB may enforce NOT NULL on details (e.g. legacy Hibernate ddl); keep optional semantics with empty string.
        log.setDetails(details != null ? details : "");
        auditLogRepository.save(log);
    }

    private String resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }
}
