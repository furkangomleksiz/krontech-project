package com.krontech.api.products.entity;

import com.krontech.api.pages.entity.Page;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
@DiscriminatorValue("PRODUCT")
public class Product extends Page {

    /**
     * Free-form HTML or markdown highlights/features block.
     * TEXT allows unrestricted length.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String highlights;

    public String getHighlights() {
        return highlights;
    }

    public void setHighlights(String highlights) {
        this.highlights = highlights;
    }
}
