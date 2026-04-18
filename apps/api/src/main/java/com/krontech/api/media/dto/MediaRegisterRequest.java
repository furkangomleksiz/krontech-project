package com.krontech.api.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Registers a media asset after the file has already been uploaded to S3/MinIO.
 * The actual upload (presigned URL or direct multipart) is handled outside this endpoint.
 */
public record MediaRegisterRequest(
        @NotBlank @Size(max = 500) String objectKey,
        @NotBlank @Size(max = 500) String fileName,
        @NotBlank @Size(max = 127) String mimeType,
        @Positive long sizeBytes,
        @Size(max = 500) String altText,
        Integer width,
        Integer height
) {
}
