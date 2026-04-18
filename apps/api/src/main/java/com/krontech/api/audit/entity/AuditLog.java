package com.krontech.api.audit.entity;

import com.krontech.api.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Immutable audit trail. One row per significant publishing or admin action.
 *
 * actor      — email of the authenticated user, or "system" for scheduled operations.
 * action     — verb in UPPER_SNAKE_CASE: PUBLISH, SCHEDULE, UNPUBLISH, ROTATE_PREVIEW_TOKEN.
 * targetType — content type: PAGE, BLOG_POST, PRODUCT, RESOURCE.
 * targetId   — UUID of the affected Page row.
 * targetSlug — slug at the time of the event (denormalized for readability in reports).
 * details    — free-form human-readable context string (old → new status, scheduled time, etc.).
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String actor;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(length = 100)
    private String targetType;

    @Column
    private UUID targetId;

    @Column(length = 500)
    private String targetSlug;

    @Column(length = 4000)
    private String details;

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public String getTargetSlug() {
        return targetSlug;
    }

    public void setTargetSlug(String targetSlug) {
        this.targetSlug = targetSlug;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
