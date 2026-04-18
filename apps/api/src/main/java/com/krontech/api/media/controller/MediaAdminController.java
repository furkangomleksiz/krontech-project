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
import org.springframework.web.bind.annotation.RestController;

/**
 * Media catalog management. Manages metadata for files uploaded to S3/MinIO.
 * The actual file upload flow (presigned URL or multipart) is deferred to a later pass.
 *
 * GET    /api/v1/admin/media?mimeType=image&page=0&size=25
 * GET    /api/v1/admin/media/{id}
 * POST   /api/v1/admin/media             — register after S3 upload
 * PATCH  /api/v1/admin/media/{id}        — update alt text / dimensions
 * DELETE /api/v1/admin/media/{id}        — ADMIN only (metadata only; S3 object not removed)
 */
@RestController
@RequestMapping("/api/v1/admin/media")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class MediaAdminController {

    private final MediaAdminService mediaAdminService;

    public MediaAdminController(MediaAdminService mediaAdminService) {
        this.mediaAdminService = mediaAdminService;
    }

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

    @PostMapping
    public ResponseEntity<MediaAdminResponse> register(@Valid @RequestBody MediaRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mediaAdminService.register(request));
    }

    @PatchMapping("/{id}")
    public MediaAdminResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody MediaUpdateRequest request
    ) {
        return mediaAdminService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        mediaAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
