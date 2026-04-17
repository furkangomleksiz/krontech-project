package com.krontech.api.seo.dto;

/**
 * Shared SEO projection returned inside all public content responses.
 * ogImageUrl is resolved from ogImageKey via ObjectStorageClient before serialization.
 */
public record SeoResponse(
        String title,
        String description,
        String canonicalPath,
        boolean noIndex,
        String ogTitle,
        String ogDescription,
        String ogImageUrl,
        String structuredDataJson
) {
}
