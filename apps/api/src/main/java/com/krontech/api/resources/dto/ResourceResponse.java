package com.krontech.api.resources.dto;

public record ResourceResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String resourceType,
        String heroImageUrl,
        /** Auto-generated first-page JPEG for PDF uploads; null when not available. */
        String previewImageUrl,
        /** Resolved download URL — either from S3 fileKey or externalUrl. */
        String downloadUrl
) {
}
