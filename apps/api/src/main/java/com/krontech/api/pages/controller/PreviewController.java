package com.krontech.api.pages.controller;

import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.service.PreviewService;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Token-gated preview endpoint. No auth required — the token itself is the access credential.
 * Tokens are short-lived UUIDs assigned per page by an authenticated editor.
 * Returns page content regardless of publish status.
 */
@RestController
@RequestMapping("/api/v1/preview")
public class PreviewController {

    private final PreviewService previewService;

    public PreviewController(PreviewService previewService) {
        this.previewService = previewService;
    }

    @GetMapping
    public PublicPageResponse preview(@RequestParam UUID token) {
        return previewService.getPreview(token);
    }
}
