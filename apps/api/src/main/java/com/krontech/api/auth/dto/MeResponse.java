package com.krontech.api.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String role,
        boolean active,
        Instant createdAt
) {
}
