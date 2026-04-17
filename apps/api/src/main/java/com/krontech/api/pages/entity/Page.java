package com.krontech.api.pages.entity;

import com.krontech.api.common.entity.BaseEntity;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.seo.entity.SeoMetadata;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * Base content record. Each locale variant of a page is a separate row.
 *
 * Unique constraint on (slug, locale) enforces that only one active record exists per URL per locale.
 *
 * contentGroupId links locale variants together for hreflang and locale-switcher support.
 * publishedAt records when the page actually went live.
 * scheduledAt records when a SCHEDULED page should be auto-promoted to PUBLISHED.
 * previewToken grants token-gated preview access to DRAFT/SCHEDULED pages.
 */
@Entity
@Table(
        name = "pages",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"slug", "locale"}, name = "uq_page_slug_locale")
        }
)
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "dtype", discriminatorType = DiscriminatorType.STRING)
public class Page extends BaseEntity {

    /**
     * Human-readable page type label for CMS purposes (e.g. "homepage", "landing-page").
     * Separate from the JPA discriminator which is set by the ORM.
     */
    @Column(nullable = false)
    private String pageType;

    @Column(nullable = false)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocaleCode locale;

    /**
     * Links all locale variants of logically the same page.
     * E.g. the EN and TR versions of the same blog post share a contentGroupId.
     * Nullable for standalone pages that have no locale counterpart yet.
     */
    @Column
    private UUID contentGroupId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublishStatus status = PublishStatus.DRAFT;

    /** Set when the page actually transitions to PUBLISHED. */
    private Instant publishedAt;

    /** Desired future publish time; only relevant while status = SCHEDULED. */
    private Instant scheduledAt;

    /**
     * Opaque UUID granting preview access to this page regardless of status.
     * Nullable until an editor explicitly requests a preview link.
     */
    @Column(unique = true)
    private UUID previewToken;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    /**
     * S3 objectKey for the primary hero/cover image.
     * URL resolved at serve time via ObjectStorageClient.
     */
    @Column(length = 500)
    private String heroImageKey;

    @Embedded
    private SeoMetadata seo = new SeoMetadata();

    public String getPageType() {
        return pageType;
    }

    public void setPageType(String pageType) {
        this.pageType = pageType;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public LocaleCode getLocale() {
        return locale;
    }

    public void setLocale(LocaleCode locale) {
        this.locale = locale;
    }

    public UUID getContentGroupId() {
        return contentGroupId;
    }

    public void setContentGroupId(UUID contentGroupId) {
        this.contentGroupId = contentGroupId;
    }

    public PublishStatus getStatus() {
        return status;
    }

    public void setStatus(PublishStatus status) {
        this.status = status;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public UUID getPreviewToken() {
        return previewToken;
    }

    public void setPreviewToken(UUID previewToken) {
        this.previewToken = previewToken;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getHeroImageKey() {
        return heroImageKey;
    }

    public void setHeroImageKey(String heroImageKey) {
        this.heroImageKey = heroImageKey;
    }

    public SeoMetadata getSeo() {
        return seo;
    }

    public void setSeo(SeoMetadata seo) {
        this.seo = seo;
    }
}
