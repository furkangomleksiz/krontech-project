package com.krontech.api.products.service;

import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.dto.ProductResponse;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.repository.ProductRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public ProductService(
            ProductRepository productRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.productRepository = productRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public ProductResponse getProduct(String slug, String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        Product product = productRepository.findBySlugAndLocaleAndStatus(slug, localeCode, PublishStatus.PUBLISHED)
                .orElseGet(() -> buildFallback(slug, localeCode));

        return mapToResponse(product);
    }

    private ProductResponse mapToResponse(Product product) {
        List<ContentBlockResponse> blocks = contentBlockRepository
                .findByPageOrderBySortOrderAsc(product)
                .stream()
                .map(this::mapBlock)
                .toList();

        String heroImageUrl = product.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(product.getHeroImageKey())
                : null;

        return new ProductResponse(
                product.getSlug(),
                product.getLocale().name().toLowerCase(),
                product.getTitle(),
                product.getSummary(),
                product.getHighlights(),
                heroImageUrl,
                SeoMapper.toResponse(product.getSeo(), objectStorageClient),
                blocks
        );
    }

    private ContentBlockResponse mapBlock(ContentBlock block) {
        return new ContentBlockResponse(block.getBlockType(), block.getSortOrder(), block.getPayloadJson());
    }

    private Product buildFallback(String slug, LocaleCode localeCode) {
        Product product = new Product();
        product.setSlug(slug);
        product.setLocale(localeCode);
        product.setPageType("product");
        product.setTitle("Kron " + slug);
        product.setSummary("Fallback product summary.");
        product.setHighlights("Fallback product highlights.");
        return product;
    }
}
