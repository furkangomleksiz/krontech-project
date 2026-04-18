package com.krontech.api.products.repository;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.products.entity.Product;
import com.krontech.api.publishing.PublishStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, java.util.UUID> {

    Optional<Product> findBySlugAndLocaleAndStatus(String slug, LocaleCode locale, PublishStatus status);

    // Admin queries — paginated, all statuses
    Page<Product> findAllByLocale(LocaleCode locale, Pageable pageable);

    Page<Product> findAllByStatus(PublishStatus status, Pageable pageable);

    Page<Product> findAllByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);
}
