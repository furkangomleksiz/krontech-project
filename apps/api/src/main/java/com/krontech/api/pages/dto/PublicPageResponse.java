package com.krontech.api.pages.dto;

import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.seo.dto.SeoResponse;
import java.util.List;

public record PublicPageResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String heroImageUrl,
        SeoResponse seo,
        List<ContentBlockResponse> blocks
) {
}
