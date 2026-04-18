package com.krontech.api.blog.repository;

import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.publishing.PublishStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    /**
     * Public listing — published only.
     * Returns List; caller streams the result.
     */
    List<BlogPost> findByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);

    Optional<BlogPost> findBySlugAndLocaleAndStatus(String slug, LocaleCode locale, PublishStatus status);

    // Admin queries — paginated, all statuses (findAllBy avoids return-type conflict with findBy variants)
    Page<BlogPost> findAllByLocale(LocaleCode locale, Pageable pageable);

    Page<BlogPost> findAllByStatus(PublishStatus status, Pageable pageable);

    Page<BlogPost> findAllByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);
}
