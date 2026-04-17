package com.krontech.api.auth.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        String role
) {
}
