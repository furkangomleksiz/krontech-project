package com.krontech.api.redirects.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Projection returned for both admin management and the public bulk-load endpoint.
 * The public endpoint uses a subset of these fields (sourcePath, targetPath, statusCode).
 */
public record RedirectRuleResponse(
        UUID id,
        String sourcePath,
        String targetPath,
        int statusCode,
        boolean active,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
