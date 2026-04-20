package com.krontech.api.products.entity;

/**
 * Fixed tabs on the product detail page (see product-detail screenshots).
 * Declaration order is the display order.
 */
public enum ProductDetailTab {
    SOLUTION("solution"),
    HOW_IT_WORKS("how_it_works"),
    KEY_BENEFITS("key_benefits"),
    RESOURCES("resources");

    private final String apiValue;

    ProductDetailTab(String apiValue) {
        this.apiValue = apiValue;
    }

    /** Stable string for public JSON (snake_case). */
    public String apiValue() {
        return apiValue;
    }
}
