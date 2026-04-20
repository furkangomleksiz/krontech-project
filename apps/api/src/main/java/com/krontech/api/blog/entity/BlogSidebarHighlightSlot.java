package com.krontech.api.blog.entity;

import com.krontech.api.common.entity.BaseEntity;
import com.krontech.api.localization.LocaleCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "blog_sidebar_highlight_slots",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_blog_highlight_locale_order",
                        columnNames = {"locale", "sort_order"}
                ),
                @UniqueConstraint(
                        name = "uq_blog_highlight_locale_post",
                        columnNames = {"locale", "blog_post_id"}
                )
        },
        indexes = @Index(name = "idx_blog_highlight_locale_order", columnList = "locale,sort_order")
)
public class BlogSidebarHighlightSlot extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LocaleCode locale;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blog_post_id", nullable = false)
    private BlogPost blogPost;

    public LocaleCode getLocale() {
        return locale;
    }

    public void setLocale(LocaleCode locale) {
        this.locale = locale;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public BlogPost getBlogPost() {
        return blogPost;
    }

    public void setBlogPost(BlogPost blogPost) {
        this.blogPost = blogPost;
    }
}
