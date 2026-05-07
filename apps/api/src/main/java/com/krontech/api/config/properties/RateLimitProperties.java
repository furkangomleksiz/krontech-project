package com.krontech.api.config.properties;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties("app.rate-limit")
@Validated
public record RateLimitProperties(
        @Positive int maxRequestsPerMinute,
        Forms forms
) {
    public record Forms(@Min(1) int maxPerHour) {}
}
