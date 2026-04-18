package com.krontech.api.media.service;

import com.krontech.api.media.dto.MediaAdminResponse;
import com.krontech.api.media.dto.MediaRegisterRequest;
import com.krontech.api.media.dto.MediaUpdateRequest;
import com.krontech.api.media.entity.MediaAsset;
import com.krontech.api.media.repository.MediaAssetRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MediaAdminService {

    private static final Logger log = LoggerFactory.getLogger(MediaAdminService.class);

    /**
     * Allowed MIME-type prefixes. Adjust to match your content team's needs.
     * Keeping this list explicit prevents uploading arbitrary executable files.
     */
    private static final String[] ALLOWED_MIME_PREFIXES = {
            "image/",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats",
            "application/vnd.ms-",
            "video/",
            "audio/",
            "text/plain",
            "text/csv",
    };

    private final MediaAssetRepository mediaAssetRepository;
    private final ObjectStorageClient objectStorageClient;

    public MediaAdminService(
            MediaAssetRepository mediaAssetRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.objectStorageClient = objectStorageClient;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public Page<MediaAdminResponse> list(String mimeTypeFilter, Pageable pageable) {
        if (mimeTypeFilter != null && !mimeTypeFilter.isBlank()) {
            return mediaAssetRepository
                    .findAllByMimeTypeStartingWith(mimeTypeFilter, pageable)
                    .map(this::toResponse);
        }
        return mediaAssetRepository.findAll(pageable).map(this::toResponse);
    }

    public MediaAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ── File upload (new) ─────────────────────────────────────────────────────

    /**
     * Uploads a file to object storage and registers its metadata in one operation.
     *
     * <p>Object key format: {@code uploads/{year}/{month}/{uuid}.{ext}}
     *
     * <p>If the database save fails after a successful S3 upload, the S3 object is deleted
     * to avoid orphaned files.
     */
    public MediaAdminResponse upload(MultipartFile file, String altText) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must not be empty.");
        }

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        validateMimeType(mimeType);

        String originalName = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename()
                : "upload";
        String objectKey = generateObjectKey(originalName);

        // Upload to object storage first.
        try (var in = file.getInputStream()) {
            objectStorageClient.upload(objectKey, in, mimeType, file.getSize());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "File read failed: " + e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Object storage unavailable — ensure MinIO is running (docker compose up -d). Detail: " + e.getMessage());
        }

        // Persist metadata; on failure, roll back the uploaded object.
        try {
            MediaAsset asset = new MediaAsset();
            asset.setObjectKey(objectKey);
            asset.setFileName(originalName);
            asset.setMimeType(mimeType);
            asset.setSizeBytes(file.getSize());
            asset.setAltText(StringUtils.hasText(altText) ? altText.strip() : null);
            return toResponse(mediaAssetRepository.save(asset));
        } catch (Exception e) {
            // Best-effort rollback — don't let a cleanup failure mask the real error.
            try {
                objectStorageClient.delete(objectKey);
                log.warn("Rolled back S3 upload for '{}' after metadata save failure.", objectKey);
            } catch (Exception rollbackEx) {
                log.error("S3 rollback failed for '{}' — orphaned object may exist: {}", objectKey, rollbackEx.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Metadata save failed after upload.");
        }
    }

    // ── Metadata-only register (legacy / import flow) ─────────────────────────

    /**
     * Registers a media asset whose file was uploaded to S3 outside this API
     * (e.g. a presigned-URL upload or a batch import).
     */
    public MediaAdminResponse register(MediaRegisterRequest request) {
        if (mediaAssetRepository.findByObjectKey(request.objectKey()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A media asset with objectKey '" + request.objectKey() + "' already exists.");
        }
        MediaAsset asset = new MediaAsset();
        asset.setObjectKey(request.objectKey());
        asset.setFileName(request.fileName());
        asset.setMimeType(request.mimeType());
        asset.setSizeBytes(request.sizeBytes());
        asset.setAltText(request.altText());
        asset.setWidth(request.width());
        asset.setHeight(request.height());
        return toResponse(mediaAssetRepository.save(asset));
    }

    // ── Updates ───────────────────────────────────────────────────────────────

    public MediaAdminResponse update(UUID id, MediaUpdateRequest request) {
        MediaAsset asset = findOrThrow(id);
        asset.setAltText(request.altText());
        asset.setWidth(request.width());
        asset.setHeight(request.height());
        return toResponse(mediaAssetRepository.save(asset));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Removes the metadata record.
     * The S3 object is intentionally NOT deleted to protect content referencing this asset
     * by objectKey. Call {@link #deleteWithFile(UUID)} if you also want to remove the file.
     */
    public void delete(UUID id) {
        mediaAssetRepository.delete(findOrThrow(id));
    }

    /**
     * Removes both the metadata record and the S3 object.
     * Use only when the asset is confirmed to have no remaining references.
     */
    public void deleteWithFile(UUID id) {
        MediaAsset asset = findOrThrow(id);
        try {
            objectStorageClient.delete(asset.getObjectKey());
        } catch (Exception e) {
            log.warn("S3 delete failed for objectKey '{}': {}. Metadata will still be removed.", asset.getObjectKey(), e.getMessage());
        }
        mediaAssetRepository.delete(asset);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private MediaAsset findOrThrow(UUID id) {
        return mediaAssetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found."));
    }

    private MediaAdminResponse toResponse(MediaAsset asset) {
        return new MediaAdminResponse(
                asset.getId(),
                asset.getObjectKey(),
                objectStorageClient.buildPublicUrl(asset.getObjectKey()),
                asset.getFileName(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getAltText(),
                asset.getWidth(),
                asset.getHeight(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }

    /**
     * Generates a unique, date-partitioned object key.
     * Format: {@code uploads/{year}/{month}/{uuid}.{ext}}
     */
    private static String generateObjectKey(String originalFilename) {
        LocalDate today = LocalDate.now();
        String ext = extractExtension(originalFilename);
        String base = UUID.randomUUID().toString();
        return "uploads/%d/%02d/%s%s".formatted(
                today.getYear(),
                today.getMonthValue(),
                base,
                ext.isEmpty() ? "" : "." + ext
        );
    }

    /**
     * Extracts the lowercase file extension, validating it contains only safe characters.
     * Returns an empty string if the extension is absent or suspicious.
     */
    private static String extractExtension(String filename) {
        if (filename == null || filename.isBlank()) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot >= filename.length() - 1) return "";
        String ext = filename.substring(dot + 1).toLowerCase();
        // Reject anything that doesn't look like a normal extension.
        return ext.matches("[a-z0-9]{1,10}") ? ext : "";
    }

    private static void validateMimeType(String mimeType) {
        for (String prefix : ALLOWED_MIME_PREFIXES) {
            if (mimeType.startsWith(prefix)) return;
        }
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "File type '" + mimeType + "' is not allowed for upload.");
    }
}
