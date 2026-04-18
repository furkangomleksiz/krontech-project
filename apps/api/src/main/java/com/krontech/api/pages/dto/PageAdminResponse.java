package com.krontech.api.pages.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;
import java.util.UUID;

/**
 * Full admin view of a base page record.
 * Returned for all statuses (DRAFT, SCHEDULED, PUBLISHED).
 * heroImageKey is returned as-is (S3 objectKey); the resolved URL is in seo.ogImageUrl.
 */
public record PageAdminResponse(
        UUID id,
        String pageType,
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
        SeoResponse seo,
        Instant createdAt,
        Instant updatedAt
) {
}
