package com.krontech.api.products.controller;

import com.krontech.api.products.dto.ProductResponse;
import com.krontech.api.products.service.ProductService;
import jakarta.validation.constraints.Pattern;
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

    @GetMapping("/{slug}")
    public ProductResponse getProduct(
            @PathVariable String slug,
            @RequestParam(defaultValue = "en") @Pattern(regexp = "^(tr|en)$") String locale
    ) {
        return productService.getProduct(slug, locale);
    }
}
