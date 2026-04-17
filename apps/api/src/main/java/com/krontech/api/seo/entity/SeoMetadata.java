package com.krontech.api.seo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Embedded SEO + Open Graph metadata.
 * ogImageKey stores an S3 objectKey; the URL is resolved via ObjectStorageClient at serve time.
 * structuredDataJson holds a verbatim JSON-LD script for schema.org markup.
 */
@Embeddable
public class SeoMetadata {

    @Column(length = 180)
    private String metaTitle;

    @Column(length = 300)
    private String metaDescription;

    @Column(length = 255)
    private String canonicalPath;

    @Column(nullable = false)
    private boolean noIndex = false;

    @Column(length = 180)
    private String ogTitle;

    @Column(length = 300)
    private String ogDescription;

    /** S3 objectKey for the Open Graph image. Resolved to a full URL by ObjectStorageClient. */
    @Column(length = 500)
    private String ogImageKey;

    /** JSON-LD block for schema.org structured data. */
    @Column(columnDefinition = "TEXT")
    private String structuredDataJson;

    public String getMetaTitle() {
        return metaTitle;
    }

    public void setMetaTitle(String metaTitle) {
        this.metaTitle = metaTitle;
    }

    public String getMetaDescription() {
        return metaDescription;
    }

    public void setMetaDescription(String metaDescription) {
        this.metaDescription = metaDescription;
    }

    public String getCanonicalPath() {
        return canonicalPath;
    }

    public void setCanonicalPath(String canonicalPath) {
        this.canonicalPath = canonicalPath;
    }

    public boolean isNoIndex() {
        return noIndex;
    }

    public void setNoIndex(boolean noIndex) {
        this.noIndex = noIndex;
    }

    public String getOgTitle() {
        return ogTitle;
    }

    public void setOgTitle(String ogTitle) {
        this.ogTitle = ogTitle;
    }

    public String getOgDescription() {
        return ogDescription;
    }

    public void setOgDescription(String ogDescription) {
        this.ogDescription = ogDescription;
    }

    public String getOgImageKey() {
        return ogImageKey;
    }

    public void setOgImageKey(String ogImageKey) {
        this.ogImageKey = ogImageKey;
    }

    public String getStructuredDataJson() {
        return structuredDataJson;
    }

    public void setStructuredDataJson(String structuredDataJson) {
        this.structuredDataJson = structuredDataJson;
    }
}
