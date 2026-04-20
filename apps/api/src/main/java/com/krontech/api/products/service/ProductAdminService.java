package com.krontech.api.products.service;

import com.krontech.api.audit.service.AuditService;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.products.ProductTabCardPresentation;
import com.krontech.api.products.dto.ProductAdminResponse;
import com.krontech.api.products.dto.ProductCreateRequest;
import com.krontech.api.products.dto.ProductResourcesTabRequest;
import com.krontech.api.products.dto.ProductTabCardWriteRequest;
import com.krontech.api.products.dto.ProductUpdateRequest;
import com.krontech.api.products.entity.Product;
import com.krontech.api.products.entity.ProductDetailTab;
import com.krontech.api.products.entity.ProductResourceLink;
import com.krontech.api.products.entity.ProductTabCard;
import com.krontech.api.products.repository.ProductRepository;
import com.krontech.api.products.repository.ProductResourceLinkRepository;
import com.krontech.api.products.repository.ProductTabCardRepository;
import com.krontech.api.resources.entity.ResourceItem;
import com.krontech.api.resources.repository.ResourceRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.publishing.service.CacheService;
import com.krontech.api.seo.SeoMapper;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductAdminService {

    private final ProductRepository productRepository;
    private final PageRepository pageRepository;
    private final ProductTabCardRepository productTabCardRepository;
    private final ProductResourceLinkRepository productResourceLinkRepository;
    private final ResourceRepository resourceRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;
    private final CacheService cacheService;
    private final EntityManager entityManager;
    private final AuditService auditService;

    public ProductAdminService(
            ProductRepository productRepository,
            PageRepository pageRepository,
            ProductTabCardRepository productTabCardRepository,
            ProductResourceLinkRepository productResourceLinkRepository,
            ResourceRepository resourceRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient,
            CacheService cacheService,
            EntityManager entityManager,
            AuditService auditService
    ) {
        this.productRepository = productRepository;
        this.pageRepository = pageRepository;
        this.productTabCardRepository = productTabCardRepository;
        this.productResourceLinkRepository = productResourceLinkRepository;
        this.resourceRepository = resourceRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
        this.cacheService = cacheService;
        this.entityManager = entityManager;
        this.auditService = auditService;
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

    @Transactional
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
        Product saved = productRepository.save(product);
        replaceTabCards(saved, request.tabCards() != null ? request.tabCards() : List.of());
        if (request.resourcesTab() != null) {
            applyResourcesTab(saved, request.resourcesTab());
            replaceResourceLinks(saved, request.resourcesTab().linkedResourceIds());
        }
        cacheService.evictContent(saved.getLocale().name().toLowerCase(), saved.getSlug());
        cacheService.evictLinkedContentGroup(saved.getContentGroupId());
        auditService.record("CREATE", "PRODUCT", saved.getId(), saved.getSlug(), null);
        return toResponse(saved);
    }

    @Transactional
    public ProductAdminResponse update(UUID id, ProductUpdateRequest request) {
        Product product = findOrThrow(id);
        String priorSlug = product.getSlug();
        LocaleCode priorLocale = product.getLocale();
        UUID priorContentGroupId = product.getContentGroupId();

        String newSlug = request.slug().strip();
        LocaleCode newLocale = LocaleCode.valueOf(request.locale().toUpperCase());
        if (pageRepository.existsBySlugAndLocaleAndIdNot(newSlug, newLocale, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another page already uses slug '" + newSlug + "' for locale " + newLocale.name().toLowerCase() + ".");
        }
        product.setSlug(newSlug);
        product.setLocale(newLocale);

        product.setTitle(request.title());
        product.setSummary(request.summary());
        product.setHeroImageKey(request.heroImageKey());
        product.setHighlights(request.highlights());
        product.setContentGroupId(request.contentGroupId());
        product.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(product.getSeo(), request.seo());
        }
        Product saved = productRepository.save(product);
        if (request.tabCards() != null) {
            replaceTabCards(saved, request.tabCards());
        }
        if (request.resourcesTab() != null) {
            applyResourcesTab(saved, request.resourcesTab());
            replaceResourceLinks(saved, request.resourcesTab().linkedResourceIds());
        }
        cacheService.evictContent(priorLocale.name().toLowerCase(), priorSlug);
        if (!priorSlug.equals(saved.getSlug()) || priorLocale != saved.getLocale()) {
            cacheService.evictContent(saved.getLocale().name().toLowerCase(), saved.getSlug());
        }
        if (priorContentGroupId != null) {
            cacheService.evictLinkedContentGroup(priorContentGroupId);
        }
        UUID newContentGroupId = saved.getContentGroupId();
        if (newContentGroupId != null && !Objects.equals(priorContentGroupId, newContentGroupId)) {
            cacheService.evictLinkedContentGroup(newContentGroupId);
        }
        auditService.record("UPDATE", "PRODUCT", saved.getId(), saved.getSlug(), null);
        return toResponse(saved);
    }

    public void updateSeo(UUID id, SeoRequest request) {
        Product product = findOrThrow(id);
        SeoMapper.applyRequest(product.getSeo(), request);
        productRepository.save(product);
        cacheService.evictContent(product.getLocale().name().toLowerCase(), product.getSlug());
        cacheService.evictLinkedContentGroup(product.getContentGroupId());
        auditService.record("UPDATE", "PRODUCT", product.getId(), product.getSlug(), "SEO metadata");
    }

    @Transactional
    public void delete(UUID id) {
        Product product = findOrThrow(id);
        String locale = product.getLocale().name().toLowerCase();
        String slug = product.getSlug();
        UUID productId = product.getId();
        UUID groupId = product.getContentGroupId();
        productResourceLinkRepository.deleteByProduct(product);
        deleteTabCardsFor(product);
        contentBlockRepository.deleteByPage(product);
        productRepository.delete(product);
        cacheService.evictContent(locale, slug);
        cacheService.evictLinkedContentGroup(groupId);
        auditService.record("DELETE", "PRODUCT", productId, slug, null);
    }

    private void deleteTabCardsFor(Product product) {
        productTabCardRepository.deleteByProduct(product);
        // Bulk delete is deferred; flush so INSERTs in replaceTabCards cannot race the unique (product_id, tab, sort_order).
        entityManager.flush();
    }

    private void replaceTabCards(Product product, List<ProductTabCardWriteRequest> requests) {
        deleteTabCardsFor(product);
        if (requests.isEmpty()) {
            return;
        }
        List<ProductTabCard> toSave = new ArrayList<>();
        for (ProductTabCardWriteRequest req : requests) {
            if (req.tab() == ProductDetailTab.RESOURCES) {
                continue;
            }
            ProductTabCard card = new ProductTabCard();
            card.setProduct(product);
            card.setTab(req.tab());
            card.setSortOrder(req.sortOrder());
            card.setTitle(req.title());
            card.setBody(req.body());
            card.setImageObjectKey(req.imageObjectKey());
            card.setImageAlt(req.imageAlt());
            toSave.add(card);
        }
        productTabCardRepository.saveAll(toSave);
    }

    private void applyResourcesTab(Product product, ProductResourcesTabRequest tab) {
        product.setResourcesIntroTitle(nullIfBlank(tab.introTitle()));
        product.setResourcesIntroBody(nullIfBlank(tab.introBody()));
        product.setResourcesIntroImageKey(nullIfBlank(tab.introImageKey()));
        product.setResourcesIntroImageAlt(nullIfBlank(tab.introImageAlt()));
    }

    private static String nullIfBlank(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s;
    }

    private void replaceResourceLinks(Product product, List<UUID> resourceIds) {
        productResourceLinkRepository.deleteByProduct(product);
        entityManager.flush();
        if (resourceIds == null || resourceIds.isEmpty()) {
            return;
        }
        var locale = product.getLocale();
        var seen = new HashSet<UUID>();
        int order = 0;
        for (UUID rid : resourceIds) {
            if (rid == null || !seen.add(rid)) {
                continue;
            }
            ResourceItem resource = resourceRepository.findById(rid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found: " + rid));
            if (resource.getLocale() != locale) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Linked resource locale must match the product locale (" + locale.name().toLowerCase() + ").");
            }
            ProductResourceLink link = new ProductResourceLink();
            link.setProduct(product);
            link.setResource(resource);
            link.setSortOrder(order++);
            productResourceLinkRepository.save(link);
        }
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    }

    private ProductAdminResponse toResponse(Product product) {
        List<UUID> linkedIds = productResourceLinkRepository
                .findByProductIdWithResourcesOrdered(product.getId())
                .stream()
                .map(l -> l.getResource().getId())
                .toList();

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
                product.getResourcesIntroTitle(),
                product.getResourcesIntroBody(),
                product.getResourcesIntroImageKey(),
                product.getResourcesIntroImageAlt(),
                linkedIds,
                ProductTabCardPresentation.toAdminItems(productTabCardRepository.findByProductId(product.getId())),
                SeoMapper.toResponse(product.getSeo(), objectStorageClient),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
