package com.krontech.api.publishing.dto;

import java.util.UUID;

public record PreviewTokenResponse(
        UUID pageId,
        UUID token,
        /** Ready-to-use preview URL (relative path). Append the frontend base URL as needed. */
        String previewPath
) {
}
