package com.krontech.api.blog.dto;

import java.util.UUID;

/** One curated sidebar slot as returned to the CMS (any publish status). */
public record BlogHighlightAdminItem(UUID id, String slug, String title, String status) {
}
