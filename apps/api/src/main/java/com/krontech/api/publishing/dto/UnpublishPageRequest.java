package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UnpublishPageRequest(@NotNull UUID pageId) {
}
