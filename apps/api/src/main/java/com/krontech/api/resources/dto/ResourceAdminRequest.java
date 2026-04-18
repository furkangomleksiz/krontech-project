package com.krontech.api.resources.dto;

import com.krontech.api.resources.entity.ResourceType;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

/**
 * Used for both create and update operations.
 * At least one of fileKey or externalUrl must be provided (enforced at service layer).
 */
public record ResourceAdminRequest(
        @NotBlank @Size(max = 200) String slug,
        @NotBlank @Pattern(regexp = "^(tr|en)$", message = "Locale must be 'tr' or 'en'.") String locale,
        UUID contentGroupId,
        @NotBlank @Size(max = 1000) String title,
        @NotBlank String summary,
        @Size(max = 500) String heroImageKey,
        @NotNull ResourceType resourceType,
        @Size(max = 500) String fileKey,
        @Size(max = 1000) String externalUrl,
        Instant scheduledAt,
        SeoRequest seo
) {
}
