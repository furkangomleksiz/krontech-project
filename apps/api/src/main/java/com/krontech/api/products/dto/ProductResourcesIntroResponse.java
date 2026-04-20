package com.krontech.api.products.dto;

/**
 * Public JSON for the wide "learn more" card on the product Resources tab.
 */
public record ProductResourcesIntroResponse(
        String title,
        String body,
        String imageUrl,
        String imageAlt
) {
}
