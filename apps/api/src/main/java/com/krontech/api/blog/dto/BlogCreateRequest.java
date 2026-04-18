package com.krontech.api.blog.dto;

import com.krontech.api.seo.dto.SeoRequest;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record BlogCreateRequest(
        @NotBlank @Size(max = 200) String slug,
        @NotBlank @Pattern(regexp = "^(tr|en)$", message = "Locale must be 'tr' or 'en'.") String locale,
        UUID contentGroupId,
        @NotBlank @Size(max = 1000) String title,
        @NotBlank String summary,
        @Size(max = 500) String heroImageKey,
        @NotBlank String body,
        @Size(max = 500) String tags,
        @Min(0) int readTimeMinutes,
        Instant scheduledAt,
        SeoRequest seo
) {
}
