package com.krontech.api.blog.dto;

import java.util.List;

/**
 * Paginated published blog list for public consumption.
 */
public record BlogListPublicResponse(
        List<BlogPreviewResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
