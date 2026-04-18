package com.krontech.api.publishing.dto;

import java.time.Instant;
import java.util.UUID;

/** Returned by every publishing action to confirm the resulting state. */
public record PublishStateResponse(
        UUID id,
        String slug,
        String locale,
        String status,
        Instant publishedAt,
        Instant scheduledAt
) {
}
