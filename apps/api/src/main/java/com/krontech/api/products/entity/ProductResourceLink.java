package com.krontech.api.products.entity;

import com.krontech.api.common.entity.BaseEntity;
import com.krontech.api.resources.entity.ResourceItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "product_resource_links",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_product_resource_links_pair",
                columnNames = {"product_id", "resource_id"}
        ),
        indexes = @Index(name = "idx_product_resource_links_product_order", columnList = "product_id,sort_order")
)
public class ProductResourceLink extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private ResourceItem resource;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public ResourceItem getResource() {
        return resource;
    }

    public void setResource(ResourceItem resource) {
        this.resource = resource;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
