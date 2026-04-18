package com.krontech.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activates Spring's {@code @Scheduled} task execution.
 * Used by {@link com.krontech.api.publishing.service.ScheduledPublishingService}
 * to auto-promote pages past their scheduledAt timestamp.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
