-- Product "Resources" tab: one intro row on products + ordered links to resource pages.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS resources_intro_title VARCHAR(500);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS resources_intro_body TEXT;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS resources_intro_image_key VARCHAR(500);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS resources_intro_image_alt VARCHAR(500);

CREATE TABLE IF NOT EXISTS product_resource_links (
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    product_id UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    CONSTRAINT uq_product_resource_links_pair UNIQUE (product_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_product_resource_links_product_order
    ON product_resource_links (product_id, sort_order);
