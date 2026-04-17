package com.krontech.api.blog.dto;

import com.krontech.api.seo.dto.SeoResponse;
import java.time.Instant;

public record BlogDetailResponse(
        String slug,
        String locale,
        String title,
        String excerpt,
        String body,
        String heroImageUrl,
        String tags,
        int readTimeMinutes,
        Instant publishedAt,
        SeoResponse seo
) {
}
