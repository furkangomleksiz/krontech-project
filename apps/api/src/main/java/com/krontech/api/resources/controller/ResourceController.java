package com.krontech.api.resources.controller;

import com.krontech.api.resources.dto.ResourceResponse;
import com.krontech.api.resources.entity.ResourceType;
import com.krontech.api.resources.service.ResourceService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Validated
@RestController
@RequestMapping("/api/v1/public/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<ResourceResponse> list(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale,
            @RequestParam(required = false) ResourceType resourceType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "24") @Min(1) @Max(100) int size
    ) {
        return resourceService.list(locale, resourceType, page, size);
    }

    @GetMapping("/{slug}")
    public ResourceResponse getBySlug(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return resourceService
                .findPublishedBySlug(locale, slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }
}
