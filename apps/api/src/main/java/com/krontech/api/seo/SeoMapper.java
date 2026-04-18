package com.krontech.api.seo;

import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.seo.dto.SeoResponse;
import com.krontech.api.seo.entity.SeoMetadata;

public final class SeoMapper {

    private SeoMapper() {
    }

    public static SeoResponse toResponse(SeoMetadata seo, ObjectStorageClient storage) {
        String ogImageUrl = seo.getOgImageKey() != null
                ? storage.buildPublicUrl(seo.getOgImageKey())
                : null;

        return new SeoResponse(
                seo.getMetaTitle(),
                seo.getMetaDescription(),
                seo.getCanonicalPath(),
                seo.isNoIndex(),
                seo.getOgTitle(),
                seo.getOgDescription(),
                ogImageUrl,
                seo.getStructuredDataJson()
        );
    }

    /** Applies a {@link com.krontech.api.seo.dto.SeoRequest} onto an embedded {@link SeoMetadata} object. */
    public static void applyRequest(SeoMetadata seo, com.krontech.api.seo.dto.SeoRequest request) {
        seo.setMetaTitle(request.metaTitle());
        seo.setMetaDescription(request.metaDescription());
        seo.setCanonicalPath(request.canonicalPath());
        seo.setNoIndex(request.noIndex());
        seo.setOgTitle(request.ogTitle());
        seo.setOgDescription(request.ogDescription());
        seo.setOgImageKey(request.ogImageKey());
        seo.setStructuredDataJson(request.structuredDataJson());
    }
}
