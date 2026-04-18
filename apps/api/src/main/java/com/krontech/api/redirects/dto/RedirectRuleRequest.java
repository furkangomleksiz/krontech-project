package com.krontech.api.redirects.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Write DTO for creating or updating a redirect rule.
 *
 * <p>Path rules:
 * <ul>
 *   <li>{@code sourcePath} must start with "/" and must not equal {@code targetPath}.</li>
 *   <li>{@code targetPath} may be an absolute path ("/tr/products/kron-pam") or a
 *       full URL for off-site redirects ("https://krontech.com.tr/...").</li>
 *   <li>{@code statusCode} must be 301 (permanent) or 302 (temporary).</li>
 * </ul>
 */
public record RedirectRuleRequest(
        @NotBlank @Size(max = 500) String sourcePath,
        @NotBlank @Size(max = 500) String targetPath,
        int statusCode,
        boolean active,
        @Size(max = 1000) String notes
) {
    @AssertTrue(message = "statusCode must be 301 (permanent) or 302 (temporary)")
    boolean isValidStatusCode() {
        return statusCode == 301 || statusCode == 302;
    }

    @AssertTrue(message = "sourcePath must start with /")
    boolean isSourcePathAbsolute() {
        return sourcePath != null && sourcePath.startsWith("/");
    }

    @AssertTrue(message = "sourcePath and targetPath must not be identical")
    boolean isNotCircular() {
        return sourcePath == null || targetPath == null || !sourcePath.equals(targetPath);
    }
}
