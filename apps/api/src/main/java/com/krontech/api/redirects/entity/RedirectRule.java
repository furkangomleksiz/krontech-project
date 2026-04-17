package com.krontech.api.redirects.entity;

import com.krontech.api.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "redirect_rules")
public class RedirectRule extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String sourcePath;

    @Column(nullable = false)
    private String targetPath;

    /** HTTP status code for the redirect (301 or 302). */
    @Column(nullable = false)
    private int statusCode;

    /**
     * Inactive rules are kept for history but not applied.
     * Prefer deactivating over deleting to preserve audit trail.
     */
    @Column(nullable = false)
    private boolean active = true;

    public String getSourcePath() {
        return sourcePath;
    }

    public void setSourcePath(String sourcePath) {
        this.sourcePath = sourcePath;
    }

    public String getTargetPath() {
        return targetPath;
    }

    public void setTargetPath(String targetPath) {
        this.targetPath = targetPath;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
