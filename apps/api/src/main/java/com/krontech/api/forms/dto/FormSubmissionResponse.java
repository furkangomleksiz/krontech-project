package com.krontech.api.forms.dto;

import java.util.UUID;

public record FormSubmissionResponse(
        UUID submissionId,
        String status
) {
}
