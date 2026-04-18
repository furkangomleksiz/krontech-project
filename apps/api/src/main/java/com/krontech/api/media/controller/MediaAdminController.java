package com.krontech.api.media.controller;

import com.krontech.api.media.dto.MediaAdminResponse;
import com.krontech.api.media.dto.MediaRegisterRequest;
import com.krontech.api.media.dto.MediaUpdateRequest;
import com.krontech.api.media.service.MediaAdminService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Media catalog management.
 *
 * <p>Upload flow (primary):
 * <pre>
 *   POST /api/v1/admin/media/upload   multipart/form-data   — upload file + register metadata
 * </pre>
 *
 * <p>Import flow (secondary — for assets already in S3):
 * <pre>
 *   POST /api/v1/admin/media          application/json      — register existing S3 object
 * </pre>
 *
 * <p>All other endpoints manage metadata of existing assets.
 *
 * <pre>
 * GET    /api/v1/admin/media?mimeType=image&page=0&size=25
 * GET    /api/v1/admin/media/{id}
 * PATCH  /api/v1/admin/media/{id}        — update alt text and/or dimensions
 * DELETE /api/v1/admin/media/{id}        — ADMIN only; removes metadata only (S3 object kept)
 * DELETE /api/v1/admin/media/{id}?deleteFile=true  — ADMIN only; removes metadata + S3 object
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin/media")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class MediaAdminController {

    private final MediaAdminService mediaAdminService;

    public MediaAdminController(MediaAdminService mediaAdminService) {
        this.mediaAdminService = mediaAdminService;
    }

    // ── List / get ─────────────────────────────────────────────────────────────

    @GetMapping
    public Page<MediaAdminResponse> list(
            @RequestParam(required = false) String mimeType,
            @PageableDefault(size = 25, sort = "createdAt") Pageable pageable
    ) {
        return mediaAdminService.list(mimeType, pageable);
    }

    @GetMapping("/{id}")
    public MediaAdminResponse getById(@PathVariable UUID id) {
        return mediaAdminService.getById(id);
    }

    // ── Upload (primary write path) ────────────────────────────────────────────

    /**
     * Accepts a multipart file upload, stores the file in S3/MinIO, and registers
     * the metadata record in one atomic-ish operation.
     *
     * <p>Form fields:
     * <ul>
     *   <li>{@code file}    (required) — the file to upload
     *   <li>{@code altText} (optional) — accessibility description for images
     * </ul>
     *
     * <p>The returned {@code publicUrl} is immediately usable as a browser-accessible URL
     * and can be set as {@code heroImageKey} on any content record.
     *
     * <p>Max file size: configured by {@code spring.servlet.multipart.max-file-size}
     * (default 20 MB, override with {@code MAX_UPLOAD_FILE_SIZE} env var).
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaAdminResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "altText", required = false) String altText
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mediaAdminService.upload(file, altText));
    }

    // ── Metadata-only register (import / batch flow) ────────────────────────────

    /**
     * Registers a media asset that was uploaded to S3 outside this API.
     * Use when importing existing assets or when the upload was done via presigned URL.
     */
    @PostMapping
    public ResponseEntity<MediaAdminResponse> register(@Valid @RequestBody MediaRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mediaAdminService.register(request));
    }

    // ── Updates ────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}")
    public MediaAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody MediaUpdateRequest request
    ) {
        return mediaAdminService.update(id, request);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    /**
     * Removes the metadata record.
     * By default ({@code deleteFile=false}) the S3 object is preserved to protect
     * any content already referencing it by objectKey.
     * Pass {@code ?deleteFile=true} to also delete the S3 object.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean deleteFile
    ) {
        if (deleteFile) {
            mediaAdminService.deleteWithFile(id);
        } else {
            mediaAdminService.delete(id);
        }
        return ResponseEntity.noContent().build();
    }
}
