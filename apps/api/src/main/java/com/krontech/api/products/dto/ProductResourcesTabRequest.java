package com.krontech.api.products.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Optional payload for the product Resources tab. When present on create/update, intro fields and
 * resource links are replaced; when omitted, existing values are left unchanged (backward compatible).
 */
public record ProductResourcesTabRequest(
        @Size(max = 500) String introTitle,
        String introBody,
        @Size(max = 500) String introImageKey,
        @Size(max = 500) String introImageAlt,
        @Size(max = 50) List<UUID> linkedResourceIds
) {
}
