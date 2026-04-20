package com.krontech.api.products.dto;

public record ProductTabCardPublicItem(
        int sortOrder,
        String title,
        String body,
        String imageUrl,
        String imageAlt
) {
}
