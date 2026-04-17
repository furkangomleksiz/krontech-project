package com.krontech.api.blog.entity;

import com.krontech.api.pages.entity.Page;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "blog_posts")
@DiscriminatorValue("BLOG_POST")
public class BlogPost extends Page {

    /** Full article body. TEXT allows unbounded length. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Estimated reading time shown in the list/detail view. */
    @Column(nullable = false)
    private int readTimeMinutes = 0;

    /**
     * Comma-separated tag labels (e.g. "PAM,Identity,Security").
     * Simple for this pass; a tag join table can replace this when filtering is needed.
     */
    @Column(length = 500)
    private String tags;

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public int getReadTimeMinutes() {
        return readTimeMinutes;
    }

    public void setReadTimeMinutes(int readTimeMinutes) {
        this.readTimeMinutes = readTimeMinutes;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}
