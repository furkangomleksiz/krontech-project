package com.krontech.api.resources.entity;

import com.krontech.api.pages.entity.Page;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "resources")
@DiscriminatorValue("RESOURCE")
public class ResourceItem extends Page {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType = ResourceType.OTHER;

    /**
     * S3 objectKey for the downloadable file.
     * Nullable if the resource is an external link rather than an uploaded file.
     * URL is resolved via ObjectStorageClient when non-null.
     */
    @Column(length = 500)
    private String fileKey;

    /**
     * External URL for resources not stored in S3.
     * At least one of fileKey or externalUrl must be non-null (enforced at service layer).
     */
    @Column(length = 1000)
    private String externalUrl;

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public String getFileKey() {
        return fileKey;
    }

    public void setFileKey(String fileKey) {
        this.fileKey = fileKey;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }
}
