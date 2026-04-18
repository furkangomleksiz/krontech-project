package com.krontech.api.pages.repository;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.publishing.PublishStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, UUID> {

    Optional<Page> findBySlugAndLocaleAndStatus(String slug, LocaleCode locale, PublishStatus status);

    Optional<Page> findBySlugAndLocale(String slug, LocaleCode locale);

    Optional<Page> findByPreviewToken(UUID previewToken);

    /** Returns all locale variants linked to the same content group. */
    List<Page> findByContentGroupId(UUID contentGroupId);

    // Admin queries — return all statuses
    org.springframework.data.domain.Page<Page> findByLocale(LocaleCode locale, Pageable pageable);

    org.springframework.data.domain.Page<Page> findByStatus(PublishStatus status, Pageable pageable);

    org.springframework.data.domain.Page<Page> findByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);

    /**
     * Used by the scheduled promotion job to find pages whose publish time has arrived.
     * Returns all SCHEDULED pages where scheduledAt is in the past.
     */
    List<Page> findByStatusAndScheduledAtBefore(PublishStatus status, java.time.Instant before);
}
