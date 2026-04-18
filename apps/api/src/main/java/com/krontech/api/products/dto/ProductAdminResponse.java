package com.krontech.api.products.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;
import java.util.UUID;

/** Full admin view of a product page. Returned for all statuses. */
public record ProductAdminResponse(
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
        String highlights,
        SeoResponse seo,
        Instant createdAt,
        Instant updatedAt
) {
}
