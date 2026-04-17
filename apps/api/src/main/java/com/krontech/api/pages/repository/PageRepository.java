package com.krontech.api.pages.repository;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.publishing.PublishStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, UUID> {

    Optional<Page> findBySlugAndLocaleAndStatus(String slug, LocaleCode locale, PublishStatus status);

    Optional<Page> findBySlugAndLocale(String slug, LocaleCode locale);

    Optional<Page> findByPreviewToken(UUID previewToken);

    /** Returns all locale variants linked to the same content group. */
    List<Page> findByContentGroupId(UUID contentGroupId);
}
