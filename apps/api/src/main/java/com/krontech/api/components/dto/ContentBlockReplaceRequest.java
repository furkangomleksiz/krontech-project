package com.krontech.api.components.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Replaces all content blocks for a page in a single atomic operation.
 * The list may be empty to clear all blocks.
 */
public record ContentBlockReplaceRequest(
        @NotNull @Valid List<BlockItem> blocks
) {
    public record BlockItem(
            @NotBlank String blockType,
            int sortOrder,
            @NotBlank String payloadJson
    ) {
    }
}
