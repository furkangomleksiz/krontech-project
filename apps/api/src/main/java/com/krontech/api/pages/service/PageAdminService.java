package com.krontech.api.pages.service;

import com.krontech.api.components.dto.ContentBlockReplaceRequest;
import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.components.repository.ContentBlockRepository;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.pages.dto.PageAdminResponse;
import com.krontech.api.pages.dto.PageCreateRequest;
import com.krontech.api.pages.dto.PageUpdateRequest;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.SeoMapper;
import com.krontech.api.seo.dto.SeoRequest;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PageAdminService {

    private final PageRepository pageRepository;
    private final ContentBlockRepository contentBlockRepository;
    private final ObjectStorageClient objectStorageClient;

    public PageAdminService(
            PageRepository pageRepository,
            ContentBlockRepository contentBlockRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.pageRepository = pageRepository;
        this.contentBlockRepository = contentBlockRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public org.springframework.data.domain.Page<PageAdminResponse> list(
            String locale, String status, Pageable pageable
    ) {
        LocaleCode localeCode = locale != null ? LocaleCode.valueOf(locale.toUpperCase()) : null;
        PublishStatus publishStatus = status != null ? PublishStatus.valueOf(status.toUpperCase()) : null;

        if (localeCode != null && publishStatus != null) {
            return pageRepository.findByLocaleAndStatus(localeCode, publishStatus, pageable).map(this::toResponse);
        } else if (localeCode != null) {
            return pageRepository.findByLocale(localeCode, pageable).map(this::toResponse);
        } else if (publishStatus != null) {
            return pageRepository.findByStatus(publishStatus, pageable).map(this::toResponse);
        }
        return pageRepository.findAll(pageable).map(this::toResponse);
    }

    public PageAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public PageAdminResponse create(PageCreateRequest request) {
        LocaleCode localeCode = LocaleCode.valueOf(request.locale().toUpperCase());
        Page page = new Page();
        page.setPageType(request.pageType());
        page.setSlug(request.slug());
        page.setLocale(localeCode);
        page.setContentGroupId(request.contentGroupId());
        page.setTitle(request.title());
        page.setSummary(request.summary());
        page.setHeroImageKey(request.heroImageKey());
        page.setStatus(PublishStatus.DRAFT);
        page.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(page.getSeo(), request.seo());
        }
        return toResponse(pageRepository.save(page));
    }

    public PageAdminResponse update(UUID id, PageUpdateRequest request) {
        Page page = findOrThrow(id);
        page.setTitle(request.title());
        page.setSummary(request.summary());
        page.setHeroImageKey(request.heroImageKey());
        page.setContentGroupId(request.contentGroupId());
        page.setScheduledAt(request.scheduledAt());
        if (request.seo() != null) {
            SeoMapper.applyRequest(page.getSeo(), request.seo());
        }
        return toResponse(pageRepository.save(page));
    }

    public void updateSeo(UUID id, SeoRequest request) {
        Page page = findOrThrow(id);
        SeoMapper.applyRequest(page.getSeo(), request);
        pageRepository.save(page);
    }

    public List<ContentBlockResponse> getBlocks(UUID id) {
        Page page = findOrThrow(id);
        return contentBlockRepository.findByPageOrderBySortOrderAsc(page).stream()
                .map(b -> new ContentBlockResponse(b.getBlockType(), b.getSortOrder(), b.getPayloadJson()))
                .toList();
    }

    @Transactional
    public List<ContentBlockResponse> replaceBlocks(UUID id, ContentBlockReplaceRequest request) {
        Page page = findOrThrow(id);
        contentBlockRepository.deleteByPage(page);

        List<ContentBlock> newBlocks = request.blocks().stream().map(item -> {
            ContentBlock block = new ContentBlock();
            block.setPage(page);
            block.setBlockType(item.blockType());
            block.setSortOrder(item.sortOrder());
            block.setPayloadJson(item.payloadJson());
            return block;
        }).toList();

        contentBlockRepository.saveAll(newBlocks);
        return newBlocks.stream()
                .map(b -> new ContentBlockResponse(b.getBlockType(), b.getSortOrder(), b.getPayloadJson()))
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        Page page = findOrThrow(id);
        contentBlockRepository.deleteByPage(page);
        pageRepository.delete(page);
    }

    private Page findOrThrow(UUID id) {
        return pageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found."));
    }

    private PageAdminResponse toResponse(Page page) {
        return new PageAdminResponse(
                page.getId(),
                page.getPageType(),
                page.getSlug(),
                page.getLocale().name().toLowerCase(),
                page.getContentGroupId(),
                page.getStatus().name(),
                page.getPublishedAt(),
                page.getScheduledAt(),
                page.getPreviewToken(),
                page.getTitle(),
                page.getSummary(),
                page.getHeroImageKey(),
                SeoMapper.toResponse(page.getSeo(), objectStorageClient),
                page.getCreatedAt(),
                page.getUpdatedAt()
        );
    }

}

