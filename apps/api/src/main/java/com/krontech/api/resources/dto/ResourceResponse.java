package com.krontech.api.resources.dto;

public record ResourceResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String resourceType,
        String heroImageUrl,
        /** Resolved download URL — either from S3 fileKey or externalUrl. */
        String downloadUrl
) {
}
