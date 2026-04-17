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
}
