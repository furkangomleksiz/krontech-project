package com.krontech.api.components.dto;

public record ContentBlockResponse(
        String blockType,
        int sortOrder,
        String payloadJson
) {
}
