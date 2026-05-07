package com.krontech.api.config.properties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties("app.auth")
@Validated
public record AuthProperties(
        @NotBlank String secret,
        @NotBlank String issuer,
        @Positive long accessTokenMinutes
) {}
