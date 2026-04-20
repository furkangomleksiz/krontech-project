package com.krontech.api.blog.repository;

import com.krontech.api.blog.entity.BlogSidebarHighlightSlot;
import com.krontech.api.localization.LocaleCode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogSidebarHighlightSlotRepository extends JpaRepository<BlogSidebarHighlightSlot, UUID> {

    @Query(
            "SELECT s FROM BlogSidebarHighlightSlot s JOIN FETCH s.blogPost WHERE s.locale = :locale ORDER BY s.sortOrder ASC")
    List<BlogSidebarHighlightSlot> findByLocaleWithPostsOrdered(@Param("locale") LocaleCode locale);

    void deleteByLocale(LocaleCode locale);
}
