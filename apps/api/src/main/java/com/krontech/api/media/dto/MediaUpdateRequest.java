package com.krontech.api.media.dto;

import jakarta.validation.constraints.Size;

/** Updates the editable metadata of an existing media asset. */
public record MediaUpdateRequest(
        @Size(max = 500) String altText,
        Integer width,
        Integer height
) {
}
