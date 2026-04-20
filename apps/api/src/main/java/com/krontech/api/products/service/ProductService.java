package com.krontech.api.products.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.dto.ProductCounterpartResponse;
import com.krontech.api.products.dto.ProductListItemResponse;
import com.krontech.api.products.dto.ProductResponse;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.repository.ProductRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private static final int MAX_LIST_BULLETS = 3;

    private final ProductRepository productRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;
    private final ObjectMapper objectMapper;
    private final ProductPublicContentAssembler productPublicContentAssembler;

    public ProductService(
            ProductRepository productRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient,
            ObjectMapper objectMapper,
            ProductPublicContentAssembler productPublicContentAssembler
    ) {
        this.productRepository = productRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
        this.objectMapper = objectMapper;
        this.productPublicContentAssembler = productPublicContentAssembler;
    }

    /**
     * Published products for the public listing page, ordered by title.
     * Cached in Redis under the {@code product-list} cache (see {@code CacheConfig}).
     */
    @Cacheable(value = "product-list", key = "#locale")
    public List<ProductListItemResponse> listPublishedProducts(String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        return productRepository.findAllByLocaleAndStatusOrderByTitleAsc(localeCode, PublishStatus.PUBLISHED).stream()
                .map(this::mapToListItem)
                .toList();
    }

    public ProductResponse getProduct(String slug, String locale) {
        LocaleCode localeCode = LocaleCode.valueOf(locale.toUpperCase());
        Product product = productRepository.findBySlugAndLocaleAndStatus(slug, localeCode, PublishStatus.PUBLISHED)
                .orElseGet(() -> buildFallback(slug, localeCode));

        return mapToResponse(product);
    }

    /**
     * Resolves the published product slug in {@code toLocale} that shares {@code contentGroupId} with the
     * product identified by ({@code slug}, {@code fromLocale}).
     */
    public Optional<ProductCounterpartResponse> getProductCounterpart(String slug, String fromLocale, String toLocale) {
        LocaleCode from = LocaleCode.valueOf(fromLocale.toUpperCase());
        LocaleCode to = LocaleCode.valueOf(toLocale.toUpperCase());
        if (from == to) {
            return Optional.of(new ProductCounterpartResponse(slug));
        }
        return productRepository
                .findBySlugAndLocaleAndStatus(slug, from, PublishStatus.PUBLISHED)
                .flatMap(product -> {
                    var groupId = product.getContentGroupId();
                    if (groupId == null) {
                        return Optional.empty();
                    }
                    return productRepository.findByContentGroupIdAndLocaleAndStatus(groupId, to, PublishStatus.PUBLISHED);
                })
                .map(Product::getSlug)
                .map(ProductCounterpartResponse::new);
    }

    private ProductListItemResponse mapToListItem(Product product) {
        String heroImageUrl = product.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(product.getHeroImageKey())
                : null;
        return new ProductListItemResponse(
                product.getSlug(),
                product.getTitle(),
                product.getSummary(),
                heroImageUrl,
                parseFeatureBullets(product.getHighlights()));
    }

    private ProductResponse mapToResponse(Product product) {
        var assembled = productPublicContentAssembler.assemble(product, true);

        List<ContentBlockResponse> blocks = product.getId() == null
                ? List.of()
                : contentBlockRepository.findByPageOrderBySortOrderAsc(product).stream()
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
                assembled.detailTabs(),
                assembled.resourcesIntro(),
                assembled.linkedResources(),
                blocks
        );
    }

    private ContentBlockResponse mapBlock(ContentBlock block) {
        return new ContentBlockResponse(block.getBlockType(), block.getSortOrder(), block.getPayloadJson());
    }

    /**
     * Parses CMS "highlights" (one feature per line, or a JSON string array) into at most
     * {@link #MAX_LIST_BULLETS} bullet strings for the public listing cards.
     */
    private List<String> parseFeatureBullets(String highlights) {
        if (highlights == null || highlights.isBlank()) {
            return List.of();
        }
        String trimmed = highlights.trim();
        if (trimmed.startsWith("[")) {
            try {
                List<String> fromJson = objectMapper.readValue(trimmed, new TypeReference<List<String>>() {});
                List<String> out = new ArrayList<>();
                for (String s : fromJson) {
                    if (s != null && !s.isBlank()) {
                        out.add(s.trim());
                        if (out.size() >= MAX_LIST_BULLETS) {
                            break;
                        }
                    }
                }
                return List.copyOf(out);
            } catch (Exception ignored) {
                // fall through to line-based parsing
            }
        }
        List<String> lines = new ArrayList<>();
        for (String line : trimmed.split("\\R")) {
            String t = line.trim();
            if (!t.isEmpty()) {
                lines.add(t);
                if (lines.size() >= MAX_LIST_BULLETS) {
                    break;
                }
            }
        }
        return List.copyOf(lines);
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
