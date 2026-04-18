package com.krontech.api.publishing.controller;

import com.krontech.api.publishing.dto.PreviewTokenResponse;
import com.krontech.api.publishing.dto.PublishPageRequest;
import com.krontech.api.publishing.dto.PublishStateResponse;
import com.krontech.api.publishing.dto.SchedulePageRequest;
import com.krontech.api.publishing.dto.UnpublishPageRequest;
import com.krontech.api.publishing.service.PublishingService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publishing lifecycle endpoints. All require ADMIN or EDITOR role.
 *
 * POST /api/v1/admin/publishing/publish                       — DRAFT|SCHEDULED → PUBLISHED
 * POST /api/v1/admin/publishing/schedule                      — DRAFT → SCHEDULED
 * POST /api/v1/admin/publishing/unpublish                     — PUBLISHED|SCHEDULED → DRAFT
 * POST /api/v1/admin/publishing/pages/{id}/preview-token      — rotate preview token
 *
 * Every endpoint returns a {@link PublishStateResponse} confirming the resulting state.
 */
@RestController
@RequestMapping("/api/v1/admin/publishing")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class PublishingController {

    private final PublishingService publishingService;

    public PublishingController(PublishingService publishingService) {
        this.publishingService = publishingService;
    }

    @PostMapping("/publish")
    public ResponseEntity<PublishStateResponse> publish(@Valid @RequestBody PublishPageRequest request) {
        return ResponseEntity.ok(publishingService.publish(request));
    }

    @PostMapping("/schedule")
    public ResponseEntity<PublishStateResponse> schedule(@Valid @RequestBody SchedulePageRequest request) {
        return ResponseEntity.ok(publishingService.schedule(request));
    }

    @PostMapping("/unpublish")
    public ResponseEntity<PublishStateResponse> unpublish(@Valid @RequestBody UnpublishPageRequest request) {
        return ResponseEntity.ok(publishingService.unpublish(request));
    }

    @PostMapping("/pages/{id}/preview-token")
    public ResponseEntity<PreviewTokenResponse> rotatePreviewToken(@PathVariable UUID id) {
        return ResponseEntity.ok(publishingService.rotatePreviewToken(id));
    }
}
