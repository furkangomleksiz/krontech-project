package com.krontech.api.blog.dto;

import java.util.List;

public record BlogHighlightsAdminResponse(String locale, List<BlogHighlightAdminItem> posts) {
}
