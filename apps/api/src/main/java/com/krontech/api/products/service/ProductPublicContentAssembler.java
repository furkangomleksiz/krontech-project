package com.krontech.api.products.service;

import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.ProductTabCardPresentation;
import com.krontech.api.products.dto.ProductDetailTabSectionResponse;
import com.krontech.api.products.dto.ProductResourcesIntroResponse;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.entity.ProductResourceLink;
import com.krontech.api.products.repository.ProductResourceLinkRepository;
import com.krontech.api.products.repository.ProductTabCardRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.resources.dto.ResourceResponse;
import com.krontech.api.resources.entity.ResourceItem;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProductPublicContentAssembler {

    private final ProductTabCardRepository productTabCardRepository;
    private final ProductResourceLinkRepository productResourceLinkRepository;
    private final ObjectStorageClient objectStorageClient;

    public ProductPublicContentAssembler(
            ProductTabCardRepository productTabCardRepository,
            ProductResourceLinkRepository productResourceLinkRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.productTabCardRepository = productTabCardRepository;
        this.productResourceLinkRepository = productResourceLinkRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public record AssembledProductContent(
            List<ProductDetailTabSectionResponse> detailTabs,
            ProductResourcesIntroResponse resourcesIntro,
            List<ResourceResponse> linkedResources
    ) {
    }

    public AssembledProductContent assemble(Product product, boolean onlyPublishedLinkedResources) {
        UUID productId = product.getId();
        if (productId == null) {
            return new AssembledProductContent(
                    ProductTabCardPresentation.toPublicSections(List.of(), objectStorageClient, false),
                    emptyIntro(),
                    List.of()
            );
        }
        var tabCards = productTabCardRepository.findByProductId(productId);
        var links = productResourceLinkRepository.findByProductIdWithResourcesOrdered(productId);
        boolean structured = hasStructuredResourcesSection(product, links);
        var detailTabs = ProductTabCardPresentation.toPublicSections(tabCards, objectStorageClient, structured);
        var intro = mapIntro(product);
        var linked = mapLinkedResources(links, onlyPublishedLinkedResources);
        return new AssembledProductContent(detailTabs, intro, linked);
    }

    private static boolean hasStructuredResourcesSection(Product product, List<ProductResourceLink> links) {
        if (!links.isEmpty()) {
            return true;
        }
        return nonBlank(product.getResourcesIntroTitle())
                || nonBlank(product.getResourcesIntroBody())
                || nonBlank(product.getResourcesIntroImageKey());
    }

    private static boolean nonBlank(String s) {
        return s != null && !s.isBlank();
    }

    private ProductResourcesIntroResponse mapIntro(Product product) {
        String imageUrl = product.getResourcesIntroImageKey() != null
                ? objectStorageClient.buildPublicUrl(product.getResourcesIntroImageKey())
                : null;
        return new ProductResourcesIntroResponse(
                emptyToNull(product.getResourcesIntroTitle()),
                emptyToNull(product.getResourcesIntroBody()),
                imageUrl,
                emptyToNull(product.getResourcesIntroImageAlt())
        );
    }

    private static String emptyToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s;
    }

    private static ProductResourcesIntroResponse emptyIntro() {
        return new ProductResourcesIntroResponse(null, null, null, null);
    }

    private List<ResourceResponse> mapLinkedResources(
            List<ProductResourceLink> links,
            boolean onlyPublished
    ) {
        List<ResourceResponse> out = new ArrayList<>();
        for (ProductResourceLink link : links) {
            ResourceItem r = link.getResource();
            if (onlyPublished && r.getStatus() != PublishStatus.PUBLISHED) {
                continue;
            }
            out.add(toResourceResponse(r));
        }
        return out;
    }

    private ResourceResponse toResourceResponse(ResourceItem resource) {
        String heroImageUrl = resource.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(resource.getHeroImageKey())
                : null;
        String downloadUrl = resolveDownloadUrl(resource);
        String previewImageUrl = resource.getFilePreviewImageKey() != null
                ? objectStorageClient.buildPublicUrl(resource.getFilePreviewImageKey())
                : null;
        return new ResourceResponse(
                resource.getSlug(),
                resource.getLocale().name().toLowerCase(),
                resource.getTitle(),
                resource.getSummary(),
                resource.getResourceType().name(),
                heroImageUrl,
                previewImageUrl,
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
