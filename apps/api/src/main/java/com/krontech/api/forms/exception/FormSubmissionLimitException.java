package com.krontech.api.forms.exception;

/**
 * Thrown when a single IP address exceeds the per-hour form submission limit.
 * Mapped to HTTP 429 Too Many Requests in {@link com.krontech.api.common.api.GlobalExceptionHandler}.
 */
public class FormSubmissionLimitException extends RuntimeException {

    public FormSubmissionLimitException() {
        super("Too many form submissions. Please wait before trying again.");
    }
}
