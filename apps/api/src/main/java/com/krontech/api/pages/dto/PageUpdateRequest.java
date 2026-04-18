package com.krontech.api.pages.dto;

import com.krontech.api.seo.dto.SeoRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record PageUpdateRequest(
        @NotBlank @Size(max = 1000) String title,
        @NotBlank String summary,
        @Size(max = 500) String heroImageKey,
        UUID contentGroupId,
        Instant scheduledAt,
        SeoRequest seo
) {
}
