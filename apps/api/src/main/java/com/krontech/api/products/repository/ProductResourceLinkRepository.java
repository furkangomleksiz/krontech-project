package com.krontech.api.products.repository;

import com.krontech.api.products.entity.Product;
import com.krontech.api.products.entity.ProductResourceLink;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductResourceLinkRepository extends JpaRepository<ProductResourceLink, UUID> {

    @Query(
            "SELECT l FROM ProductResourceLink l JOIN FETCH l.resource WHERE l.product.id = :productId ORDER BY l.sortOrder ASC"
    )
    List<ProductResourceLink> findByProductIdWithResourcesOrdered(@Param("productId") UUID productId);

    void deleteByProduct(Product product);

    boolean existsByProduct_Id(UUID productId);
}
