package com.krontech.api.pages.dto;

import java.time.Instant;

/**
 * Lightweight row for public page listings (e.g. homepage carousel). Same underlying rows
 * as the admin Pages list, filtered to {@code PUBLISHED} and excluding the homepage slug.
 *
 * <p>For {@code pageType} {@code resource}, {@code previewImageUrl} mirrors
 * {@link com.krontech.api.resources.dto.ResourceResponse#previewImageUrl()} (generated PDF
 * cover). Consumers should pick {@code heroImageUrl} first, then fall back to
 * {@code previewImageUrl}, same as the public resources grid.
 */
public record PublicPageListItemResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String heroImageUrl,
        String pageType,
        Instant publishedAt,
        String previewImageUrl
) {
}
