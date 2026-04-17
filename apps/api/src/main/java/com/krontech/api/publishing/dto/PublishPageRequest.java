package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PublishPageRequest(
        @NotBlank String slug,
        @NotBlank @Pattern(regexp = "^(tr|en)$") String locale
) {
}
