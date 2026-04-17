package com.krontech.api.pages.service;

import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.pages.dto.PublicPageResponse;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.seo.SeoMapper;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PreviewService {

    private final PageRepository pageRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public PreviewService(
            PageRepository pageRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.pageRepository = pageRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
    }

    /**
     * Returns a page in any publish status if the token matches.
     * Allows editors to preview DRAFT and SCHEDULED content before it goes live.
     */
    public PublicPageResponse getPreview(UUID previewToken) {
        Page page = pageRepository.findByPreviewToken(previewToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired preview token."));

        return mapToPageResponse(page);
    }

    /**
     * Generates (or regenerates) a preview token for a given page.
     * Rotates the existing token if called again.
     */
    public UUID rotatePreviewToken(UUID pageId) {
        Page page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Page not found: " + pageId));

        UUID newToken = UUID.randomUUID();
        page.setPreviewToken(newToken);
        pageRepository.save(page);
        return newToken;
    }

    private PublicPageResponse mapToPageResponse(Page page) {
        List<ContentBlockResponse> blocks = contentBlockRepository
                .findByPageOrderBySortOrderAsc(page)
                .stream()
                .map(b -> new ContentBlockResponse(b.getBlockType(), b.getSortOrder(), b.getPayloadJson()))
                .toList();

        String heroImageUrl = page.getHeroImageKey() != null
                ? objectStorageClient.buildPublicUrl(page.getHeroImageKey())
                : null;

        return new PublicPageResponse(
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getTitle(),
                page.getSummary(),
                heroImageUrl,
                SeoMapper.toResponse(page.getSeo(), objectStorageClient),
                blocks
        );
    }
}
