package com.krontech.api.config.properties;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties("app.cors")
@Validated
public record CorsProperties(@NotBlank String allowedOrigins) {}
