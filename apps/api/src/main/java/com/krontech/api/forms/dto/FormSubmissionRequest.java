package com.krontech.api.forms.dto;

import com.krontech.api.forms.entity.FormType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FormSubmissionRequest(
        @NotNull FormType formType,
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String company,
        String phone,
        String jobTitle,
        @NotBlank @Size(min = 10, max = 4000) String message,
        boolean consentAccepted,
        String sourcePage
) {
}
