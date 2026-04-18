package com.krontech.api.blog.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;
import java.util.UUID;

/** Full admin view of a blog post. Returned for all statuses. */
public record BlogAdminResponse(
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
        String body,
        String tags,
        int readTimeMinutes,
        SeoResponse seo,
        Instant createdAt,
        Instant updatedAt
) {
}
