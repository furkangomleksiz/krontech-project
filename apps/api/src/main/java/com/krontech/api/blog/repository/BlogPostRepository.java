package com.krontech.api.blog.repository;

import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.publishing.PublishStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    /**
     * Uses Pageable for proper, extensible pagination.
     * Call with: PageRequest.of(page, size, Sort.by("publishedAt").descending())
     */
    List<BlogPost> findByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);

    Optional<BlogPost> findBySlugAndLocaleAndStatus(String slug, LocaleCode locale, PublishStatus status);
}
