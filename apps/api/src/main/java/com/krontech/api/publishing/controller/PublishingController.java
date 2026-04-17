package com.krontech.api.publishing.controller;

import com.krontech.api.publishing.dto.PublishPageRequest;
import com.krontech.api.publishing.service.PublishingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/publishing")
public class PublishingController {

    private final PublishingService publishingService;

    public PublishingController(PublishingService publishingService) {
        this.publishingService = publishingService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    @PostMapping("/publish")
    public ResponseEntity<Void> publish(@Valid @RequestBody PublishPageRequest request) {
        publishingService.publish(request);
        return ResponseEntity.accepted().build();
    }
}
