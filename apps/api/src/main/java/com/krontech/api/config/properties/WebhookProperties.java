package com.krontech.api.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.webhook.form-submission")
public record WebhookProperties(String url) {}
