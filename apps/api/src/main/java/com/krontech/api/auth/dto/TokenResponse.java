package com.krontech.api.auth.dto;

import java.time.Instant;

public record TokenResponse(
        String accessToken,
        String tokenType,
        String role,
        String email,
        Instant expiresAt
) {
}
