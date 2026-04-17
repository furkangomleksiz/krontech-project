package com.krontech.api.forms.event;

import com.krontech.api.forms.entity.FormSubmission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/**
 * Webhook extension point for form submissions.
 *
 * After a form is successfully persisted, {@link FormSubmissionCreatedEvent} is published
 * and this listener fires. If {@code app.webhook.form-submission.url} is set to a non-empty
 * URL, this is where the outbound HTTP call should be made.
 *
 * Current implementation: structured log only. To activate webhook delivery:
 *   1. Set {@code FORM_WEBHOOK_URL} in the environment.
 *   2. Inject {@code RestClient} or {@code WebClient} and POST the submission payload.
 *   3. Add {@code @Async} + {@code @EnableAsync} for non-blocking delivery.
 */
@Service
public class WebhookNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WebhookNotificationService.class);

    @Value("${app.webhook.form-submission.url:}")
    private String webhookUrl;

    @EventListener
    public void onFormSubmission(FormSubmissionCreatedEvent event) {
        FormSubmission s = event.getSubmission();

        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.info("form_submission_received id={} type={} email={} company={} source={}",
                    s.getId(), s.getFormType(), s.getEmail(), s.getCompany(), s.getSourcePage());
            return;
        }

        // TODO: POST to webhookUrl with JSON body:
        // {
        //   "id": "<uuid>",
        //   "formType": "CONTACT",
        //   "fullName": "...",
        //   "email": "...",
        //   "company": "...",
        //   "department": "...",
        //   "phone": "...",
        //   "jobTitle": "...",
        //   "message": "...",
        //   "sourcePage": "...",
        //   "submittedAt": "<ISO-8601>"
        // }
        log.info("form_submission_webhook_pending id={} url={}", s.getId(), webhookUrl);
    }
}
