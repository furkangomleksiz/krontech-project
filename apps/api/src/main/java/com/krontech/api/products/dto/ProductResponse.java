package com.krontech.api.products.dto;

import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.seo.dto.SeoResponse;
import java.util.List;

public record ProductResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String highlights,
        String heroImageUrl,
        SeoResponse seo,
        List<ContentBlockResponse> blocks
) {
}
