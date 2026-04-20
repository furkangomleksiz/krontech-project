package com.krontech.api.blog.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record BlogHighlightsUpdateRequest(
        @NotNull @Size(max = 5) List<UUID> postIds
) {
}
