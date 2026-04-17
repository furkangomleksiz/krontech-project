package com.krontech.api.blog.dto;

import java.time.Instant;

public record BlogPreviewResponse(
        String slug,
        String locale,
        String title,
        String excerpt,
        String heroImageUrl,
        String tags,
        int readTimeMinutes,
        Instant publishedAt
) {
}
