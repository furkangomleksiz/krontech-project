package com.krontech.api.resources.service;

import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.resources.dto.ResourceAdminRequest;
import com.krontech.api.resources.dto.ResourceAdminResponse;
import com.krontech.api.resources.entity.ResourceItem;
import com.krontech.api.resources.entity.ResourceType;
import com.krontech.api.resources.repository.ResourceRepository;
import com.krontech.api.seo.SeoMapper;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ResourceAdminService {

    private final ResourceRepository resourceRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;
    private final ResourcePdfPreviewService resourcePdfPreviewService;

    public ResourceAdminService(
            ResourceRepository resourceRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient,
            ResourcePdfPreviewService resourcePdfPreviewService
    ) {
        this.resourceRepository = resourceRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
        this.resourcePdfPreviewService = resourcePdfPreviewService;
    }

    public Page<ResourceAdminResponse> list(
            String locale, String status, String resourceType, Pageable pageable
    ) {
        LocaleCode localeCode = locale != null ? LocaleCode.valueOf(locale.toUpperCase()) : null;
        PublishStatus publishStatus = status != null ? PublishStatus.valueOf(status.toUpperCase()) : null;
        ResourceType resType = resourceType != null ? ResourceType.valueOf(resourceType.toUpperCase()) : null;

        if (localeCode != null && publishStatus != null) {
            return resourceRepository.findAllByLocaleAndStatus(localeCode, publishStatus, pageable).map(this::toResponse);
        } else if (localeCode != null && resType != null) {
            return resourceRepository.findAllByLocaleAndResourceType(localeCode, resType, pageable).map(this::toResponse);
        } else if (localeCode != null) {
            return resourceRepository.findAllByLocale(localeCode, pageable).map(this::toResponse);
        } else if (publishStatus != null) {
            return resourceRepository.findAllByStatus(publishStatus, pageable).map(this::toResponse);
        } else if (resType != null) {
            return resourceRepository.findAllByResourceType(resType, pageable).map(this::toResponse);
        }
        return resourceRepository.findAll(pageable).map(this::toResponse);
    }

    public ResourceAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ResourceAdminResponse create(ResourceAdminRequest request) {
        validateFileOrUrl(request);
        LocaleCode localeCode = LocaleCode.valueOf(request.locale().toUpperCase());
        ResourceItem item = new ResourceItem();
        item.setPageType("resource");
        item.setSlug(request.slug());
        item.setLocale(localeCode);
        item.setContentGroupId(request.contentGroupId());
        item.setTitle(request.title());
        item.setSummary(request.summary());
        item.setHeroImageKey(request.heroImageKey());
        item.setResourceType(request.resourceType());
        item.setFileKey(request.fileKey());
        item.setExternalUrl(request.externalUrl());
        item.setStatus(PublishStatus.DRAFT);
        item.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(item.getSeo(), request.seo());
        }
        ResourceItem saved = resourceRepository.save(item);
        resourcePdfPreviewService.syncPreviewFromStoredFile(saved);
        return toResponse(resourceRepository.save(saved));
    }

    @Transactional
    public ResourceAdminResponse update(UUID id, ResourceAdminRequest request) {
        validateFileOrUrl(request);
        ResourceItem item = findOrThrow(id);
        item.setTitle(request.title());
        item.setSummary(request.summary());
        item.setHeroImageKey(request.heroImageKey());
        item.setResourceType(request.resourceType());
        item.setFileKey(request.fileKey());
        item.setExternalUrl(request.externalUrl());
        item.setContentGroupId(request.contentGroupId());
        item.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(item.getSeo(), request.seo());
        }
        ResourceItem saved = resourceRepository.save(item);
        resourcePdfPreviewService.syncPreviewFromStoredFile(saved);
        return toResponse(resourceRepository.save(saved));
    }

    public void updateSeo(UUID id, SeoRequest request) {
        ResourceItem item = findOrThrow(id);
        SeoMapper.applyRequest(item.getSeo(), request);
        resourceRepository.save(item);
    }

    @Transactional
    public void delete(UUID id) {
        ResourceItem item = findOrThrow(id);
        resourcePdfPreviewService.removePreviewObjectIfPresent(item);
        contentBlockRepository.deleteByPage(item);
        resourceRepository.delete(item);
    }

    private void validateFileOrUrl(ResourceAdminRequest request) {
        boolean hasFile = request.fileKey() != null && !request.fileKey().isBlank();
        boolean hasUrl = request.externalUrl() != null && !request.externalUrl().isBlank();
        if (!hasFile && !hasUrl) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either fileKey or externalUrl must be provided.");
        }
    }

    private ResourceItem findOrThrow(UUID id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found."));
    }

    private ResourceAdminResponse toResponse(ResourceItem item) {
        return new ResourceAdminResponse(
                item.getId(),
                item.getSlug(),
                item.getLocale().name().toLowerCase(),
                item.getContentGroupId(),
                item.getStatus().name(),
                item.getPublishedAt(),
                item.getScheduledAt(),
                item.getPreviewToken(),
                item.getTitle(),
                item.getSummary(),
                item.getHeroImageKey(),
                item.getResourceType().name(),
                item.getFileKey(),
                item.getExternalUrl(),
                item.getFilePreviewImageKey(),
                SeoMapper.toResponse(item.getSeo(), objectStorageClient),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
