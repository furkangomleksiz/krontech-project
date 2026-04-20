package com.krontech.api.resources.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;
import java.util.UUID;

/** Full admin view of a resource item. Returned for all statuses. */
public record ResourceAdminResponse(
        UUID id,
        String slug,
        String locale,
        UUID contentGroupId,
        String status,
        Instant publishedAt,
        Instant scheduledAt,
        UUID previewToken,
        String title,
        String summary,
        String heroImageKey,
        String resourceType,
        String fileKey,
        String externalUrl,
        String filePreviewImageKey,
        SeoResponse seo,
        Instant createdAt,
        Instant updatedAt
) {
}
