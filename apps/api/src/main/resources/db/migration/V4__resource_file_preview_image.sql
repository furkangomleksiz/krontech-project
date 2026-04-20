-- Auto-generated JPEG thumbnail (first PDF page) for resource cards when no hero image is set.
ALTER TABLE resources
    ADD COLUMN IF NOT EXISTS file_preview_image_key VARCHAR(500);
