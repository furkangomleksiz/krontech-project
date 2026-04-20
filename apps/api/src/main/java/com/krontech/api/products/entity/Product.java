package com.krontech.api.products.entity;

import com.krontech.api.pages.entity.Page;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
@DiscriminatorValue("PRODUCT")
public class Product extends Page {

    /**
     * Free-form HTML or markdown highlights/features block.
     * TEXT allows unrestricted length.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String highlights;

    /** Heading for the wide intro card on the Resources tab (optional). */
    @Column(name = "resources_intro_title", length = 500)
    private String resourcesIntroTitle;

    @Column(name = "resources_intro_body", columnDefinition = "TEXT")
    private String resourcesIntroBody;

    @Column(name = "resources_intro_image_key", length = 500)
    private String resourcesIntroImageKey;

    @Column(name = "resources_intro_image_alt", length = 500)
    private String resourcesIntroImageAlt;

    public String getHighlights() {
        return highlights;
    }

    public void setHighlights(String highlights) {
        this.highlights = highlights;
    }

    public String getResourcesIntroTitle() {
        return resourcesIntroTitle;
    }

    public void setResourcesIntroTitle(String resourcesIntroTitle) {
        this.resourcesIntroTitle = resourcesIntroTitle;
    }

    public String getResourcesIntroBody() {
        return resourcesIntroBody;
    }

    public void setResourcesIntroBody(String resourcesIntroBody) {
        this.resourcesIntroBody = resourcesIntroBody;
    }

    public String getResourcesIntroImageKey() {
        return resourcesIntroImageKey;
    }

    public void setResourcesIntroImageKey(String resourcesIntroImageKey) {
        this.resourcesIntroImageKey = resourcesIntroImageKey;
    }

    public String getResourcesIntroImageAlt() {
        return resourcesIntroImageAlt;
    }

    public void setResourcesIntroImageAlt(String resourcesIntroImageAlt) {
        this.resourcesIntroImageAlt = resourcesIntroImageAlt;
    }
}
