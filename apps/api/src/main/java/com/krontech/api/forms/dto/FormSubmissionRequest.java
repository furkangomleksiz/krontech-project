package com.krontech.api.forms.dto;

import com.krontech.api.forms.entity.FormType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FormSubmissionRequest(

        @NotNull(message = "Form type is required.")
        FormType formType,

        @NotBlank(message = "Full name is required.")
        @Size(min = 2, max = 200, message = "Full name must be between 2 and 200 characters.")
        String fullName,

        @NotBlank(message = "Email address is required.")
        @Email(message = "Enter a valid email address.")
        String email,

        @NotBlank(message = "Company name is required.")
        @Size(max = 200, message = "Company name must not exceed 200 characters.")
        String company,

        /** Optional — e.g. IT & Security, Management */
        @Size(max = 200)
        String department,

        @Size(max = 50, message = "Phone number must not exceed 50 characters.")
        String phone,

        @Size(max = 200, message = "Job title must not exceed 200 characters.")
        String jobTitle,

        @NotBlank(message = "Message is required.")
        @Size(min = 10, max = 4000, message = "Message must be between 10 and 4000 characters.")
        String message,

        /**
         * Must be {@code true} before the submission is accepted.
         * Validated here (DTO layer) so the check is enforced regardless of which
         * service method handles the request.
         */
        @AssertTrue(message = "You must accept the privacy policy before submitting.")
        boolean consentAccepted,

        /** URL path of the page where the form was submitted, for attribution. */
        @Size(max = 500)
        String sourcePage,

        /**
         * Honeypot field — rendered as a visually hidden input on the frontend.
         * Real users never fill it in; bots typically do.
         * Any non-blank value here signals automated submission.
         * No validation annotation: any value is syntactically valid; the check is
         * performed in {@link com.krontech.api.forms.service.FormSubmissionService}.
         */
        String website

) {
}
