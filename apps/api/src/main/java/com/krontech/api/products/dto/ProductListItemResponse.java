package com.krontech.api.products.dto;

import java.util.List;

/**
 * Lightweight product row for the public product listing page.
 */
public record ProductListItemResponse(
        String slug,
        String title,
        String summary,
        String heroImageUrl,
        List<String> featureBullets
) {
}
