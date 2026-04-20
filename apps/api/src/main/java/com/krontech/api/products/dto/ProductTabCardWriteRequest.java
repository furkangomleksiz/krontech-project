package com.krontech.api.products.dto;

import com.krontech.api.products.entity.ProductDetailTab;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductTabCardWriteRequest(
        @NotNull ProductDetailTab tab,
        @Min(0) int sortOrder,
        @NotBlank @Size(max = 500) String title,
        @NotBlank String body,
        @Size(max = 500) String imageObjectKey,
        @Size(max = 500) String imageAlt
) {
}
