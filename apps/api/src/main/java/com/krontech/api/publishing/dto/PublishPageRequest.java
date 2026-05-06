package com.krontech.api.publishing.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PublishPageRequest(@NotNull UUID pageId) {
}
