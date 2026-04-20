package com.krontech.api.products.dto;

import java.util.List;

/** One of the four fixed tabs, with ordered cards for public product detail. */
public record ProductDetailTabSectionResponse(
        String tab,
        List<ProductTabCardPublicItem> cards
) {
}
