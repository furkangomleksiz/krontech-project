package com.krontech.api.resources.service;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.resources.dto.ResourceResponse;
import com.krontech.api.resources.entity.ResourceItem;
import com.krontech.api.resources.entity.ResourceType;
import com.krontech.api.resources.repository.ResourceRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ObjectStorageClient objectStorageClient;

    public ResourceService(ResourceRepository resourceRepository, ObjectStorageClient objectStorageClient) {
        this.resourceRepository = resourceRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public List<ResourceResponse> list(String locale, ResourceType resourceType, int page, int size) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        var pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());

        List<ResourceItem> items = resourceType != null
                ? resourceRepository.findByLocaleAndStatusAndResourceType(
                        localeCode, PublishStatus.PUBLISHED, resourceType, pageable)
                : resourceRepository.findByLocaleAndStatus(localeCode, PublishStatus.PUBLISHED, pageable);

        return items.stream().map(this::mapToResponse).toList();
    }

    private ResourceResponse mapToResponse(ResourceItem resource) {
        String heroImageUrl = resource.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(resource.getHeroImageKey())
                : null;

        String downloadUrl = resolveDownloadUrl(resource);

        return new ResourceResponse(
                resource.getSlug(),
                resource.getLocale().name().toLowerCase(),
                resource.getTitle(),
                resource.getSummary(),
                resource.getResourceType().name(),
                heroImageUrl,
                downloadUrl
        );
    }

    private String resolveDownloadUrl(ResourceItem resource) {
        if (resource.getFileKey() != null) {
            return objectStorageClient.buildPublicUrl(resource.getFileKey());
        }
        return Optional.ofNullable(resource.getExternalUrl()).orElse(null);
    }
}
