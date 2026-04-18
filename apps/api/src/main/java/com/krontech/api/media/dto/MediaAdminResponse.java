package com.krontech.api.media.dto;

import java.time.Instant;
import java.util.UUID;

public record MediaAdminResponse(
        UUID id,
        String objectKey,
        String publicUrl,
        String fileName,
        String mimeType,
        long sizeBytes,
        String altText,
        Integer width,
        Integer height,
        Instant createdAt,
        Instant updatedAt
) {
}
