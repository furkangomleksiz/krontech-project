package com.krontech.api.pages.dto;

import com.krontech.api.components.dto.ContentBlockResponse;
import com.krontech.api.products.dto.ProductDetailTabSectionResponse;
import com.krontech.api.products.dto.ProductResourcesIntroResponse;
import com.krontech.api.resources.dto.ResourceResponse;
import com.krontech.api.seo.dto.SeoResponse;
import java.util.List;

public record PublicPageResponse(
        String slug,
        String locale,
        String title,
        String summary,
        String heroImageUrl,
        SeoResponse seo,
        List<ContentBlockResponse> blocks,
        /** CMS page type (e.g. {@code product}, {@code generic}). */
        String pageType,
        /**
         * Populated for {@link com.krontech.api.products.entity.Product} pages; tabbed cards for the product detail layout.
         * Null for non-product pages.
         */
        List<ProductDetailTabSectionResponse> detailTabs,
        /** Intro card for the product Resources tab; null when not a product or not configured. */
        ProductResourcesIntroResponse resourcesIntro,
        /** Linked downloadable resources for the product Resources tab; empty when none. */
        List<ResourceResponse> linkedResources,
        /**
         * Full article text for {@link com.krontech.api.blog.entity.BlogPost} rows; null for pages that use content blocks instead.
         */
        String body
) {
}
