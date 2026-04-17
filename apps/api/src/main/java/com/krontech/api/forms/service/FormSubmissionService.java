package com.krontech.api.forms.service;

import com.krontech.api.forms.dto.FormSubmissionRequest;
import com.krontech.api.forms.dto.FormSubmissionResponse;
import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.event.FormSubmissionCreatedEvent;
import com.krontech.api.forms.exception.FormSubmissionLimitException;
import com.krontech.api.forms.repository.FormSubmissionRepository;
import com.krontech.api.infrastructure.ratelimit.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class FormSubmissionService {

    private final FormSubmissionRepository formSubmissionRepository;
    private final RateLimitService rateLimitService;
    private final ApplicationEventPublisher eventPublisher;

    public FormSubmissionService(
            FormSubmissionRepository formSubmissionRepository,
            RateLimitService rateLimitService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.formSubmissionRepository = formSubmissionRepository;
        this.rateLimitService = rateLimitService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Persists a validated form submission and fires a post-save event.
     *
     * Anti-spam strategy (layered):
     * 1. Honeypot: if the hidden {@code website} field is non-blank, a bot filled it.
     *    Return a fake success response without persisting — the bot is none the wiser.
     * 2. Per-IP hourly rate limit (default 5/h): prevents scripted submission floods.
     * 3. Consent check via {@code @AssertTrue} in the DTO ensures no bypass at the
     *    controller boundary.
     */
    public FormSubmissionResponse save(FormSubmissionRequest request, HttpServletRequest httpRequest) {
        // 1. Honeypot check — silently succeed without persisting
        if (request.website() != null && !request.website().isBlank()) {
            return new FormSubmissionResponse(UUID.randomUUID(), "RECEIVED");
        }

        // 2. Per-IP form rate limit
        String ip = httpRequest.getRemoteAddr();
        if (!rateLimitService.allowFormSubmission(ip)) {
            throw new FormSubmissionLimitException();
        }

        // 3. Map and persist
        FormSubmission submission = new FormSubmission();
        submission.setFormType(request.formType());
        submission.setFullName(request.fullName());
        submission.setEmail(request.email());
        submission.setCompany(request.company());
        submission.setDepartment(request.department());
        submission.setPhone(request.phone());
        submission.setJobTitle(request.jobTitle());
        submission.setMessage(request.message());
        submission.setConsentAccepted(true); // guaranteed by @AssertTrue in the DTO
        submission.setSourcePage(request.sourcePage());
        submission.setIpAddress(ip);

        FormSubmission created = formSubmissionRepository.save(submission);

        // 4. Notify downstream consumers (webhook, CRM integration, etc.)
        eventPublisher.publishEvent(new FormSubmissionCreatedEvent(this, created));

        return new FormSubmissionResponse(created.getId(), "RECEIVED");
    }
}
