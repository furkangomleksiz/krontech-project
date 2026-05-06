package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record SchedulePageRequest(
        @NotNull UUID pageId,
        @NotNull @Future(message = "scheduledAt must be a future instant.") Instant scheduledAt
) {
}
