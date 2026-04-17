package com.krontech.api.forms.event;

import com.krontech.api.forms.entity.FormSubmission;
import org.springframework.context.ApplicationEvent;

/**
 * Published by {@link com.krontech.api.forms.service.FormSubmissionService} after a
 * form submission is successfully persisted.
 *
 * Consumers (e.g. {@link WebhookNotificationService}) listen with {@code @EventListener}.
 * To make delivery async, annotate the listener method with {@code @Async} and enable
 * {@code @EnableAsync} in a configuration class.
 */
public class FormSubmissionCreatedEvent extends ApplicationEvent {

    private final FormSubmission submission;

    public FormSubmissionCreatedEvent(Object source, FormSubmission submission) {
        super(source);
        this.submission = submission;
    }

    public FormSubmission getSubmission() {
        return submission;
    }
}
