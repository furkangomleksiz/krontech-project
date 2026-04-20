package com.krontech.api.products.dto;

import java.util.UUID;

public record ProductTabCardAdminItem(
        UUID id,
        String tab,
        int sortOrder,
        String title,
        String body,
        String imageObjectKey,
        String imageAlt
) {
}
