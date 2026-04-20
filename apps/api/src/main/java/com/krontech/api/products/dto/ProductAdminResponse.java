package com.krontech.api.products.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;
import java.util.List;
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
        String resourcesIntroTitle,
        String resourcesIntroBody,
        String resourcesIntroImageKey,
        String resourcesIntroImageAlt,
        List<UUID> linkedResourceIds,
        List<ProductTabCardAdminItem> tabCards,
        SeoResponse seo,
        Instant createdAt,
        Instant updatedAt
) {
}
