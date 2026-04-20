package com.krontech.api.products.entity;

import com.krontech.api.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "product_tab_cards",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_product_tab_cards_product_tab_order",
                        columnNames = {"product_id", "tab", "sort_order"}
                )
        },
        indexes = @Index(name = "idx_product_tab_cards_product_id", columnList = "product_id")
)
public class ProductTabCard extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProductDetailTab tab;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /**
     * S3 object key for the card image; URL built via {@link com.krontech.api.media.service.ObjectStorageClient}.
     */
    @Column(length = 500)
    private String imageObjectKey;

    /** Optional override; falls back to catalog alt on the asset when null. */
    @Column(length = 500)
    private String imageAlt;

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public ProductDetailTab getTab() {
        return tab;
    }

    public void setTab(ProductDetailTab tab) {
        this.tab = tab;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getImageObjectKey() {
        return imageObjectKey;
    }

    public void setImageObjectKey(String imageObjectKey) {
        this.imageObjectKey = imageObjectKey;
    }

    public String getImageAlt() {
        return imageAlt;
    }

    public void setImageAlt(String imageAlt) {
        this.imageAlt = imageAlt;
    }
}
