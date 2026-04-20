package com.krontech.api.pages.dto;

import java.time.Instant;

/**
 * Lightweight row for public page listings (e.g. homepage carousel). Same underlying rows
 * as the admin Pages list, filtered to {@code PUBLISHED} and excluding the homepage slug.
 */
public record PublicPageListItemResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String heroImageUrl,
        String pageType,
        Instant publishedAt
) {
}
