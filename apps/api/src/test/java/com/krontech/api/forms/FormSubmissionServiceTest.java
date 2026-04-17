package com.krontech.api.forms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.krontech.api.forms.dto.FormSubmissionRequest;
import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.entity.FormType;
import com.krontech.api.forms.repository.FormSubmissionRepository;
import com.krontech.api.forms.service.FormSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ValidationException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class FormSubmissionServiceTest {

    private final FormSubmissionRepository repository = Mockito.mock(FormSubmissionRepository.class);
    private final FormSubmissionService service = new FormSubmissionService(repository);
    private final HttpServletRequest httpRequest = mock(HttpServletRequest.class);

    @Test
    void shouldPersistValidSubmission() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(repository.save(any(FormSubmission.class))).thenAnswer(invocation -> {
            FormSubmission saved = invocation.getArgument(0);
            FormSubmission persisted = new FormSubmission();
            persisted.setFormType(saved.getFormType());
            persisted.setFullName(saved.getFullName());
            persisted.setEmail(saved.getEmail());
            persisted.setCompany(saved.getCompany());
            persisted.setMessage(saved.getMessage());
            persisted.setConsentAccepted(saved.isConsentAccepted());
            return persisted;
        });

        FormSubmissionRequest request = new FormSubmissionRequest(
                FormType.CONTACT,
                "Ada Lovelace",
                "ada@example.com",
                "Kron",
                null,
                null,
                "Please contact me for a demo.",
                true,
                "/en/contact"
        );

        assertEquals("RECEIVED", service.save(request, httpRequest).status());
    }

    @Test
    void shouldPersistDemoRequestFormType() {
        when(httpRequest.getRemoteAddr()).thenReturn("10.0.0.1");
        when(repository.save(any(FormSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FormSubmissionRequest request = new FormSubmissionRequest(
                FormType.DEMO_REQUEST,
                "Grace Hopper",
                "grace@example.com",
                "NavalOps",
                "+1-555-0100",
                "CTO",
                "We need a live demo of the PAM module.",
                true,
                "/en/products/kronpam"
        );

        assertEquals("RECEIVED", service.save(request, httpRequest).status());
    }

    @Test
    void shouldRejectWhenConsentMissing() {
        FormSubmissionRequest request = new FormSubmissionRequest(
                FormType.CONTACT,
                "Ada Lovelace",
                "ada@example.com",
                "Kron",
                null,
                null,
                "Please contact me for a demo.",
                false,
                null
        );

        assertThrows(ValidationException.class, () -> service.save(request, httpRequest));
    }
}
