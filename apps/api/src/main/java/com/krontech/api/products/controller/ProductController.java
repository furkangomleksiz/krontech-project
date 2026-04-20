package com.krontech.api.products.controller;

import com.krontech.api.products.dto.ProductCounterpartResponse;
import com.krontech.api.products.dto.ProductListItemResponse;
import com.krontech.api.products.dto.ProductResponse;
import com.krontech.api.products.service.ProductService;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/public/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductListItemResponse> listProducts(
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return productService.listPublishedProducts(locale);
    }

    @GetMapping("/{slug}")
    public ProductResponse getProduct(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return productService.getProduct(slug, locale);
    }

    /** Published sibling slug for locale switching when TR/EN products share {@code contentGroupId}. */
    @GetMapping("/{slug}/counterpart")
    public ProductCounterpartResponse getProductCounterpart(
            @PathVariable String slug,
            @RequestParam @Pattern(regexp = "^(tr|en)$") String fromLocale,
            @RequestParam @Pattern(regexp = "^(tr|en)$") String toLocale
    ) {
        return productService
                .getProductCounterpart(slug, fromLocale, toLocale)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No linked counterpart."));
    }
}
