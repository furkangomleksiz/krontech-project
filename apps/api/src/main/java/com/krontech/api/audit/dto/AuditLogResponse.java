package com.krontech.api.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        Instant createdAt,
        String actor,
        String action,
        String targetType,
        UUID targetId,
        String targetSlug,
        String details
) {
}
