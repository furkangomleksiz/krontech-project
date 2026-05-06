ALTER TABLE pages DROP CONSTRAINT uq_page_slug_locale;
ALTER TABLE pages ADD CONSTRAINT uq_page_slug_locale_dtype UNIQUE (slug, locale, dtype);
