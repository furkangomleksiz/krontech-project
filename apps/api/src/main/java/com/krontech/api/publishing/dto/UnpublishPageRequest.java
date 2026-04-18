package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UnpublishPageRequest(
        @NotBlank String slug,
        @NotBlank @Pattern(regexp = "^(tr|en)$", message = "Locale must be 'tr' or 'en'.") String locale
) {
}
