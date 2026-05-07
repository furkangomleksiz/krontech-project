package com.krontech.api.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.web")
public record WebProperties(String url, String revalidateSecret) {}
