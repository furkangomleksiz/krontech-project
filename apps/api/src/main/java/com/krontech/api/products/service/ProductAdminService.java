package com.krontech.api.products.service;

import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.dto.ProductAdminResponse;
import com.krontech.api.products.dto.ProductCreateRequest;
import com.krontech.api.products.dto.ProductUpdateRequest;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.repository.ProductRepository;
import com.krontech.api.publishing.PublishStatus;
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
public class ProductAdminService {

    private final ProductRepository productRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public ProductAdminService(
            ProductRepository productRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.productRepository = productRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public Page<ProductAdminResponse> list(String locale, String status, Pageable pageable) {
        LocaleCode localeCode = locale != null ? LocaleCode.valueOf(locale.toUpperCase()) : null;
        PublishStatus publishStatus = status != null ? PublishStatus.valueOf(status.toUpperCase()) : null;

        if (localeCode != null && publishStatus != null) {
            return productRepository.findAllByLocaleAndStatus(localeCode, publishStatus, pageable).map(this::toResponse);
        } else if (localeCode != null) {
            return productRepository.findAllByLocale(localeCode, pageable).map(this::toResponse);
        } else if (publishStatus != null) {
            return productRepository.findAllByStatus(publishStatus, pageable).map(this::toResponse);
        }
        return productRepository.findAll(pageable).map(this::toResponse);
    }

    public ProductAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public ProductAdminResponse create(ProductCreateRequest request) {
        LocaleCode localeCode = LocaleCode.valueOf(request.locale().toUpperCase());
        Product product = new Product();
        product.setPageType("product");
        product.setSlug(request.slug());
        product.setLocale(localeCode);
        product.setContentGroupId(request.contentGroupId());
        product.setTitle(request.title());
        product.setSummary(request.summary());
        product.setHeroImageKey(request.heroImageKey());
        product.setHighlights(request.highlights());
        product.setStatus(PublishStatus.DRAFT);
        product.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(product.getSeo(), request.seo());
        }
        return toResponse(productRepository.save(product));
    }

    public ProductAdminResponse update(UUID id, ProductUpdateRequest request) {
        Product product = findOrThrow(id);
        product.setTitle(request.title());
        product.setSummary(request.summary());
        product.setHeroImageKey(request.heroImageKey());
        product.setHighlights(request.highlights());
        product.setContentGroupId(request.contentGroupId());
        product.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(product.getSeo(), request.seo());
        }
        return toResponse(productRepository.save(product));
    }

    public void updateSeo(UUID id, SeoRequest request) {
        Product product = findOrThrow(id);
        SeoMapper.applyRequest(product.getSeo(), request);
        productRepository.save(product);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = findOrThrow(id);
        contentBlockRepository.deleteByPage(product);
        productRepository.delete(product);
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    }

    private ProductAdminResponse toResponse(Product product) {
        return new ProductAdminResponse(
                product.getId(),
                product.getSlug(),
                product.getLocale().name().toLowerCase(),
                product.getContentGroupId(),
                product.getStatus().name(),
                product.getPublishedAt(),
                product.getScheduledAt(),
                product.getPreviewToken(),
                product.getTitle(),
                product.getSummary(),
                product.getHeroImageKey(),
                product.getHighlights(),
                SeoMapper.toResponse(product.getSeo(), objectStorageClient),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
