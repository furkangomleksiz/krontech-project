package com.krontech.api.media.entity;

import com.krontech.api.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Central media catalog. Every uploaded file gets a row here.
 * Content pieces reference media by objectKey. The public URL is built at serve time
 * via ObjectStorageClient.buildPublicUrl(objectKey) — no URL stored here.
 */
@Entity
@Table(name = "media_assets")
public class MediaAsset extends BaseEntity {

    /** S3/MinIO object key (path within the bucket). Globally unique. */
    @Column(nullable = false, unique = true)
    private String objectKey;

    /** Original filename as uploaded by the user. */
    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String mimeType;

    @Column(nullable = false)
    private long sizeBytes;

    /** Image alt text for accessibility. Nullable for non-image assets. */
    @Column(length = 500)
    private String altText;

    /** Pixel width; null for non-image assets. */
    private Integer width;

    /** Pixel height; null for non-image assets. */
    private Integer height;

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }
}
