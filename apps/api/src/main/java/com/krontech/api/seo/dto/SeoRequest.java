package com.krontech.api.seo.dto;

import jakarta.validation.constraints.Size;

/**
 * Write DTO for updating SEO metadata on any content record.
 * ogImageKey is an S3 objectKey — not a URL. The URL is resolved at serve time.
 */
public record SeoRequest(
        @Size(max = 180) String metaTitle,
        @Size(max = 300) String metaDescription,
        @Size(max = 255) String canonicalPath,
        boolean noIndex,
        @Size(max = 180) String ogTitle,
        @Size(max = 300) String ogDescription,
        @Size(max = 500) String ogImageKey,
        String structuredDataJson
) {
}
