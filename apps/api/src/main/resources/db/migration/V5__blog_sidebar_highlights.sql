-- Curated blog sidebar (up to 5 posts per locale), managed in the CMS.

CREATE TABLE IF NOT EXISTS blog_sidebar_highlight_slots (
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    locale VARCHAR(10) NOT NULL,
    sort_order INTEGER NOT NULL,
    blog_post_id UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    CONSTRAINT chk_blog_highlight_sort_order CHECK (sort_order >= 0 AND sort_order < 5),
    CONSTRAINT uq_blog_highlight_locale_order UNIQUE (locale, sort_order),
    CONSTRAINT uq_blog_highlight_locale_post UNIQUE (locale, blog_post_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_highlight_locale_order
    ON blog_sidebar_highlight_slots (locale, sort_order);
