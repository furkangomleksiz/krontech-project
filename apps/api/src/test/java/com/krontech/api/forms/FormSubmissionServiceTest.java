package com.krontech.api.forms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.forms.dto.FormSubmissionRequest;
import com.krontech.api.forms.dto.FormSubmissionResponse;
import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.entity.FormType;
import com.krontech.api.forms.exception.FormSubmissionLimitException;
import com.krontech.api.forms.repository.FormSubmissionRepository;
import com.krontech.api.forms.service.FormSubmissionService;
import com.krontech.api.infrastructure.ratelimit.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.ApplicationEventPublisher;

class FormSubmissionServiceTest {

    private final FormSubmissionRepository repository = Mockito.mock(FormSubmissionRepository.class);
    private final RateLimitService rateLimitService = mock(RateLimitService.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final FormSubmissionService service =
            new FormSubmissionService(repository, rateLimitService, eventPublisher);
    private final HttpServletRequest httpRequest = mock(HttpServletRequest.class);

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        // By default allow form submissions
        when(rateLimitService.allowFormSubmission("127.0.0.1")).thenReturn(true);
    }

    // ── Happy-path tests ─────────────────────────────────────────────────────

    @Test
    void shouldPersistValidContactSubmission() {
        mockRepositorySave();

        FormSubmissionRequest request = contactRequest("Please contact me for a demo.", false);

        FormSubmissionResponse response = service.save(request, httpRequest);

        assertEquals("RECEIVED", response.status());
        verify(repository).save(any(FormSubmission.class));
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void shouldPersistDemoRequestFormType() {
        mockRepositorySave();
        when(httpRequest.getRemoteAddr()).thenReturn("10.0.0.1");
        when(rateLimitService.allowFormSubmission("10.0.0.1")).thenReturn(true);

        FormSubmissionRequest request = new FormSubmissionRequest(
                FormType.DEMO_REQUEST,
                "Grace Hopper",
                "grace@example.com",
                "NavalOps",
                "Engineering",   // department
                "+1-555-0100",   // phone
                "CTO",           // jobTitle
                "We need a live demo of the PAM module.",
                true,            // consentAccepted
                "/en/products/kron-pam",
                ""               // website (honeypot — blank)
        );

        FormSubmissionResponse response = service.save(request, httpRequest);

        assertEquals("RECEIVED", response.status());
        verify(repository).save(any(FormSubmission.class));
    }

    // ── Anti-spam tests ──────────────────────────────────────────────────────

    @Test
    void shouldSilentlySucceedWithoutPersistingWhenHoneypotFilled() {
        // Bots fill the hidden honeypot field; service returns fake success but never calls save.
        FormSubmissionRequest request = new FormSubmissionRequest(
                FormType.CONTACT,
                "Bot Name",
                "bot@spam.example",
                "SpamCo",
                null, null, null,
                "Buy cheap stuff now!!",
                true,
                "/en/contact",
                "http://spam.example" // honeypot is non-blank
        );

        FormSubmissionResponse response = service.save(request, httpRequest);

        assertEquals("RECEIVED", response.status()); // fake success
        verify(repository, never()).save(any());      // never persisted
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void shouldRejectWhenFormRateLimitExceeded() {
        when(rateLimitService.allowFormSubmission("127.0.0.1")).thenReturn(false);

        FormSubmissionRequest request = contactRequest("Legitimate message here.", false);

        assertThrows(FormSubmissionLimitException.class, () -> service.save(request, httpRequest));
        verify(repository, never()).save(any());
    }

    // ── Note on consent validation ───────────────────────────────────────────
    // @AssertTrue(message = "...") on FormSubmissionRequest.consentAccepted means
    // consent is rejected at the DTO/Bean Validation layer (before the service is
    // called), not inside the service. This is tested via controller integration
    // tests; the service itself no longer enforces it.

    // ── Helpers ──────────────────────────────────────────────────────────────

    private FormSubmissionRequest contactRequest(String message, boolean honeypotFilled) {
        return new FormSubmissionRequest(
                FormType.CONTACT,
                "Ada Lovelace",
                "ada@example.com",
                "Kron",
                null,             // department
                null,             // phone
                null,             // jobTitle
                message,
                true,             // consentAccepted
                "/en/contact",
                honeypotFilled ? "http://spam.example" : ""  // website (honeypot)
        );
    }

    private void mockRepositorySave() {
        when(repository.save(any(FormSubmission.class))).thenAnswer(invocation -> {
            FormSubmission s = invocation.getArgument(0);
            // Simulate JPA assign an ID on save (normally done by @GeneratedValue)
            FormSubmission persisted = new FormSubmission();
            persisted.setFormType(s.getFormType());
            persisted.setFullName(s.getFullName());
            persisted.setEmail(s.getEmail());
            persisted.setCompany(s.getCompany());
            persisted.setMessage(s.getMessage());
            persisted.setConsentAccepted(s.isConsentAccepted());
            return persisted;
        });
    }
}
