package com.krontech.api.products.repository;

import com.krontech.api.products.entity.Product;
import com.krontech.api.products.entity.ProductTabCard;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductTabCardRepository extends JpaRepository<ProductTabCard, UUID> {

    List<ProductTabCard> findByProductId(UUID productId);

    void deleteByProduct(Product product);
}
