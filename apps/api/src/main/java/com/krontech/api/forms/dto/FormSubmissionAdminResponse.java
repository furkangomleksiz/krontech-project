package com.krontech.api.forms.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Full submission record exposed to admin users.
 *
 * All fields are included so the JSON response is directly export-friendly.
 * The CSV export endpoint uses the same field order as the field declarations here.
 *
 * {@code consentAccepted} is always {@code true} in practice (rejected by @AssertTrue
 * if false), but is included for audit completeness.
 */
public record FormSubmissionAdminResponse(
        UUID id,
        Instant submittedAt,
        String formType,
        String fullName,
        String email,
        String company,
        String department,
        String jobTitle,
        String phone,
        String message,
        boolean consentAccepted,
        String sourcePage,
        String ipAddress
) {

    /** CSV header row — field order must match {@link #toCsvRow()}. */
    public static String csvHeader() {
        return "id,submittedAt,formType,fullName,email,company,department,jobTitle,phone,message,consentAccepted,sourcePage,ipAddress";
    }

    /** Serialises this record to a single CSV row. Values are quoted to handle commas. */
    public String toCsvRow() {
        return String.join(",",
                csv(id != null ? id.toString() : ""),
                csv(submittedAt != null ? submittedAt.toString() : ""),
                csv(formType),
                csv(fullName),
                csv(email),
                csv(company),
                csv(department),
                csv(jobTitle),
                csv(phone),
                csv(message),
                csv(String.valueOf(consentAccepted)),
                csv(sourcePage),
                csv(ipAddress)
        );
    }

    private static String csv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
