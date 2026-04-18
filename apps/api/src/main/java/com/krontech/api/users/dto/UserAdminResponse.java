package com.krontech.api.users.dto;

import java.time.Instant;
import java.util.UUID;

public record UserAdminResponse(
        UUID id,
        String email,
        String role,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
