-- Full baseline schema for the Krontech API (mirrors JPA entities).
-- Hibernate is configured with ddl-auto: validate — evolve the database only via Flyway.

CREATE TABLE pages (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dtype VARCHAR(31) NOT NULL,
    page_type VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    locale VARCHAR(255) NOT NULL,
    content_group_id UUID,
    status VARCHAR(255) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    preview_token UUID,
    title VARCHAR(1000) NOT NULL,
    summary TEXT NOT NULL,
    hero_image_key VARCHAR(500),
    meta_title VARCHAR(180),
    meta_description VARCHAR(300),
    canonical_path VARCHAR(255),
    no_index BOOLEAN NOT NULL DEFAULT FALSE,
    og_title VARCHAR(180),
    og_description VARCHAR(300),
    og_image_key VARCHAR(500),
    structured_data_json TEXT,
    CONSTRAINT pages_pkey PRIMARY KEY (id),
    CONSTRAINT uq_page_slug_locale UNIQUE (slug, locale),
    CONSTRAINT uq_pages_preview_token UNIQUE (preview_token)
);

CREATE TABLE blog_posts (
    id UUID NOT NULL,
    body TEXT NOT NULL,
    read_time_minutes INTEGER NOT NULL DEFAULT 0,
    tags VARCHAR(500),
    CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
    CONSTRAINT fk_blog_posts_page FOREIGN KEY (id) REFERENCES pages (id) ON DELETE CASCADE
);

CREATE TABLE products (
    id UUID NOT NULL,
    highlights TEXT NOT NULL,
    resources_intro_title VARCHAR(500),
    resources_intro_body TEXT,
    resources_intro_image_key VARCHAR(500),
    resources_intro_image_alt VARCHAR(500),
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT fk_products_page FOREIGN KEY (id) REFERENCES pages (id) ON DELETE CASCADE
);

CREATE TABLE resources (
    id UUID NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    file_key VARCHAR(500),
    external_url VARCHAR(1000),
    file_preview_image_key VARCHAR(500),
    CONSTRAINT resources_pkey PRIMARY KEY (id),
    CONSTRAINT fk_resources_page FOREIGN KEY (id) REFERENCES pages (id) ON DELETE CASCADE
);

CREATE TABLE content_blocks (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    page_id UUID NOT NULL,
    block_type VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL,
    payload_json VARCHAR(12000) NOT NULL,
    CONSTRAINT content_blocks_pkey PRIMARY KEY (id),
    CONSTRAINT fk_content_blocks_page FOREIGN KEY (page_id) REFERENCES pages (id)
);

CREATE INDEX idx_content_blocks_page_id ON content_blocks (page_id);

CREATE TABLE product_tab_cards (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    product_id UUID NOT NULL,
    tab VARCHAR(32) NOT NULL,
    sort_order INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    image_object_key VARCHAR(500),
    image_alt VARCHAR(500),
    CONSTRAINT product_tab_cards_pkey PRIMARY KEY (id),
    CONSTRAINT fk_product_tab_cards_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT uq_product_tab_cards_product_tab_order UNIQUE (product_id, tab, sort_order)
);

CREATE INDEX idx_product_tab_cards_product_id ON product_tab_cards (product_id);

CREATE TABLE product_resource_links (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    product_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT product_resource_links_pkey PRIMARY KEY (id),
    CONSTRAINT uq_product_resource_links_pair UNIQUE (product_id, resource_id),
    CONSTRAINT fk_product_resource_links_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_resource_links_resource FOREIGN KEY (resource_id) REFERENCES pages (id) ON DELETE CASCADE
);

CREATE INDEX idx_product_resource_links_product_order ON product_resource_links (product_id, sort_order);

CREATE TABLE blog_sidebar_highlight_slots (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    locale VARCHAR(10) NOT NULL,
    sort_order INTEGER NOT NULL,
    blog_post_id UUID NOT NULL,
    CONSTRAINT blog_sidebar_highlight_slots_pkey PRIMARY KEY (id),
    CONSTRAINT fk_blog_sidebar_highlight_post FOREIGN KEY (blog_post_id) REFERENCES pages (id) ON DELETE CASCADE,
    CONSTRAINT chk_blog_highlight_sort_order CHECK (sort_order >= 0 AND sort_order < 5),
    CONSTRAINT uq_blog_highlight_locale_order UNIQUE (locale, sort_order),
    CONSTRAINT uq_blog_highlight_locale_post UNIQUE (locale, blog_post_id)
);

CREATE INDEX idx_blog_highlight_locale_order ON blog_sidebar_highlight_slots (locale, sort_order);

CREATE TABLE audit_logs (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actor VARCHAR(200) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id UUID,
    target_slug VARCHAR(500),
    details VARCHAR(4000),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE user_accounts (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT user_accounts_pkey PRIMARY KEY (id),
    CONSTRAINT uk_user_accounts_email UNIQUE (email)
);

CREATE TABLE redirect_rules (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_path VARCHAR(255) NOT NULL,
    target_path VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(1000),
    CONSTRAINT redirect_rules_pkey PRIMARY KEY (id),
    CONSTRAINT uk_redirect_rules_source_path UNIQUE (source_path)
);

CREATE TABLE media_assets (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    object_key VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    alt_text VARCHAR(500),
    width INTEGER,
    height INTEGER,
    CONSTRAINT media_assets_pkey PRIMARY KEY (id),
    CONSTRAINT uk_media_assets_object_key UNIQUE (object_key)
);

CREATE TABLE form_submissions (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    form_type VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    department VARCHAR(200),
    phone VARCHAR(200),
    job_title VARCHAR(200),
    message TEXT NOT NULL,
    consent_accepted BOOLEAN NOT NULL,
    source_page VARCHAR(500),
    ip_address VARCHAR(50),
    CONSTRAINT form_submissions_pkey PRIMARY KEY (id)
);
