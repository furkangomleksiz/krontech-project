package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;

public record SchedulePageRequest(
        @NotBlank String slug,
        @NotBlank @Pattern(regexp = "^(tr|en)$", message = "Locale must be 'tr' or 'en'.") String locale,
        @NotNull @Future(message = "scheduledAt must be a future instant.") Instant scheduledAt
) {
}
