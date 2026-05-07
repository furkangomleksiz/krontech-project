package com.krontech.api.publishing.service;

import com.krontech.api.blog.entity.BlogPost;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.products.entity.Product;
import com.krontech.api.resources.entity.ResourceItem;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Cache eviction and on-demand frontend revalidation.
 *
 * <h2>Two-layer eviction on every publish/unpublish</h2>
 * <ol>
 *   <li><strong>Redis (Spring Cache):</strong> Evicts only the caches relevant to the changed
 *       content type — blog, product, resource, or generic page — so a slug shared across
 *       dtypes (permitted since V2 unique constraints are per-dtype) never causes cross-type
 *       eviction.  Evicting a non-existent key is safe and has no side effects.</li>
 *   <li><strong>Next.js ISR:</strong> Asynchronously calls
 *       {@code POST {webAppUrl}/api/revalidate?secret=...&path=...} for the frontend
 *       paths that belong to the changed content type.</li>
 * </ol>
 *
 * <h2>Cache eviction by content type</h2>
 * <ul>
 *   <li>{@link #evictBlogPost}  — pages, blog-list, blog-highlights, blog-detail, page-list</li>
 *   <li>{@link #evictProduct}   — pages, product-list (both locales), page-list</li>
 *   <li>{@link #evictResource}  — pages, resource-list, page-list</li>
 *   <li>{@link #evictPage}      — pages, page-list</li>
 * </ul>
 * Use {@link #evictForPage(Page)} when only a {@link Page} proxy is available; it dispatches
 * to the correct method via {@code Hibernate.unproxy}.
 *
 * <h2>Fail-open design</h2>
 * Both layers catch and log exceptions without re-throwing.  A Redis failure does not
 * block a publish; a Next.js revalidation failure does not block a publish.  In the
 * worst case, ISR TTL governs cache freshness (max 2 h for blog detail).
 *
 * <h2>Async revalidation</h2>
 * Revalidation HTTP calls run in a daemon thread ({@code CompletableFuture.runAsync}).
 * The publish API response returns to the editor immediately.
 *
 * <h2>Configuration</h2>
 * <pre>
 *   app.web.url               — Base URL of the Next.js frontend (default: http://localhost:3000)
 *   app.web.revalidate-secret — Shared secret for the /api/revalidate endpoint
 * </pre>
 * If either value is blank, frontend revalidation is skipped (Redis eviction still runs).
 */
@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    /** Retries smooth over Docker Compose races (API publishes before Next.js accepts TCP). */
    private static final int REVALIDATE_MAX_ATTEMPTS = 4;

    private static final long REVALIDATE_RETRY_MS = 400L;

    private final CacheManager cacheManager;
    private final RestClient restClient;
    private final PageRepository pageRepository;
    private final String webAppUrl;
    private final String revalidateSecret;

    public CacheService(
            CacheManager cacheManager,
            RestClient restClient,
            PageRepository pageRepository,
            @Value("${app.web.url:}") String webAppUrl,
            @Value("${app.web.revalidate-secret:}") String revalidateSecret
    ) {
        this.cacheManager = cacheManager;
        this.restClient = restClient;
        this.pageRepository = pageRepository;
        this.webAppUrl = webAppUrl;
        this.revalidateSecret = revalidateSecret;
    }

    @PostConstruct
    void logRevalidationConfig() {
        if (webAppUrl.isBlank() || revalidateSecret.isBlank()) {
            log.warn(
                    "Next.js on-demand revalidation is DISABLED: set WEB_APP_URL and REVALIDATE_SECRET "
                            + "(must match the Next.js REVALIDATE_SECRET). "
                            + "Until then, the public site may show stale HTML until the Next.js ISR TTL expires "
                            + "(e.g. up to 2 h for blog detail). Redis cache eviction still runs on publish/save.");
            log.warn(
                    "revalidation_config webAppUrlConfigured={} revalidateSecretConfigured={}",
                    !webAppUrl.isBlank(),
                    !revalidateSecret.isBlank());
        } else {
            log.info(
                    "revalidation_config enabled webAppHost={} revalidateSecretLength={}",
                    safeHostForLog(webAppUrl),
                    revalidateSecret.length());
        }
    }

    // ── Type-specific eviction methods ────────────────────────────────────────

    /**
     * Evicts blog-related caches for the given slug/locale and revalidates blog paths.
     * Does not touch product-list or resource-list.
     */
    public void evictBlogPost(String locale, String slug) {
        log.info("cache_eviction_started type=blog_post locale={} slug={}", locale, slug);
        evictFromCache("pages",           slug + ":" + locale);
        evictFromCache("blog-list",       locale);
        evictFromCache("blog-highlights", locale);
        evictFromCache("blog-detail",     slug + ":" + locale);
        clearCacheFully("page-list");
        log.info("cache_eviction_finished type=blog_post locale={} slug={}", locale, slug);
        revalidateAsync(locale, slug, List.of(
                "/" + locale,
                "/" + locale + "/blog",
                "/" + locale + "/blog/" + slug
        ));
    }

    /**
     * Evicts product-related caches for the given slug/locale and revalidates product paths.
     * Both locale variants of product-list are evicted so a stale sibling locale is always cleared.
     * Does not touch blog or resource caches.
     */
    public void evictProduct(String locale, String slug) {
        log.info("cache_eviction_started type=product locale={} slug={}", locale, slug);
        evictFromCache("pages",        slug + ":" + locale);
        evictFromCache("product-list", "tr");
        evictFromCache("product-list", "en");
        clearCacheFully("page-list");
        log.info("cache_eviction_finished type=product locale={} slug={}", locale, slug);
        revalidateAsync(locale, slug, List.of(
                "/" + locale + "/products",
                "/" + locale + "/products/" + slug
        ));
    }

    /**
     * Evicts resource-related caches for the given slug/locale and revalidates resource paths.
     * Does not touch blog or product caches.
     */
    public void evictResource(String locale, String slug) {
        log.info("cache_eviction_started type=resource locale={} slug={}", locale, slug);
        evictFromCache("pages",         slug + ":" + locale);
        evictFromCache("resource-list", locale);
        clearCacheFully("page-list");
        log.info("cache_eviction_finished type=resource locale={} slug={}", locale, slug);
        revalidateAsync(locale, slug, List.of(
                "/" + locale + "/resources",
                "/" + locale + "/resources/" + slug
        ));
    }

    /**
     * Evicts the generic page cache for the given slug/locale and revalidates the locale root.
     */
    public void evictPage(String locale, String slug) {
        log.info("cache_eviction_started type=page locale={} slug={}", locale, slug);
        evictFromCache("pages", slug + ":" + locale);
        clearCacheFully("page-list");
        log.info("cache_eviction_finished type=page locale={} slug={}", locale, slug);
        revalidateAsync(locale, slug, List.of("/" + locale));
    }

    /**
     * Dispatches to the appropriate type-specific eviction method based on the concrete Page subtype.
     * Uses Hibernate.unproxy to resolve lazy-loaded proxy instances.
     */
    public void evictForPage(Page page) {
        Page concrete = Hibernate.unproxy(page, Page.class);
        String locale = page.getLocale().name().toLowerCase();
        String slug = page.getSlug();
        if (concrete instanceof BlogPost) {
            evictBlogPost(locale, slug);
        } else if (concrete instanceof Product) {
            evictProduct(locale, slug);
        } else if (concrete instanceof ResourceItem) {
            evictResource(locale, slug);
        } else {
            evictPage(locale, slug);
        }
    }

    /**
     * Clears the curated blog sidebar cache and revalidates the blog index for the locale
     * (layout revalidation is triggered from the Next.js route handler for that path).
     */
    public void evictBlogHighlights(String locale) {
        log.info("blog_highlights_eviction_started locale={}", locale);
        evictFromCache("blog-highlights", locale);
        CompletableFuture.runAsync(() -> {
                    log.info("frontend_revalidation_batch_started locale={} slug=(blog-only) pathCount=1", locale);
                    revalidateFrontendPath("/" + locale + "/blog");
                    log.info("frontend_revalidation_batch_finished locale={} slug=(blog-only)", locale);
                })
                .exceptionally(ex -> {
                    log.warn("frontend_revalidation_thread_failed locale={} reason={}", locale, ex.getMessage());
                    return null;
                });
    }

    public void evictLinkedContentGroup(UUID contentGroupId) {
        if (contentGroupId == null) {
            return;
        }
        try {
            List<Page> linked = pageRepository.findByContentGroupId(contentGroupId);
            log.info("content_group_eviction_started groupId={} linkedLocales={}", contentGroupId, linked.size());
            for (Page page : linked) {
                evictForPage(page);
            }
            log.info("content_group_eviction_finished groupId={}", contentGroupId);
        } catch (Exception e) {
            log.warn("cache_evict_linked_group_failed groupId={} reason={}", contentGroupId, e.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void revalidateAsync(String locale, String slug, List<String> paths) {
        CompletableFuture.runAsync(() -> {
                    log.info(
                            "frontend_revalidation_batch_started locale={} slug={} pathCount={} webAppHost={}",
                            locale,
                            slug,
                            paths.size(),
                            webAppUrl.isBlank() ? "(none)" : safeHostForLog(webAppUrl));
                    for (String path : paths) {
                        revalidateFrontendPath(path);
                    }
                    log.info("frontend_revalidation_batch_finished locale={} slug={}", locale, slug);
                })
                .exceptionally(ex -> {
                    log.warn(
                            "frontend_revalidation_thread_failed locale={} slug={} reason={}",
                            locale,
                            slug,
                            ex.getMessage());
                    return null;
                });
    }

    /**
     * Evicts a single key from the named Spring cache.
     * If the cache does not exist or Redis is unavailable, logs a warning and continues.
     */
    private void evictFromCache(String cacheName, String key) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache == null) {
                log.warn("cache_evict_skipped cache={} key={} reason=no_such_cache_registered", cacheName, key);
                return;
            }
            cache.evict(key);
            log.info("cache_evicted cache={} key={}", cacheName, key);
        } catch (Exception e) {
            // Cache eviction failure must not block the publish flow.
            log.warn("cache_evict_failed cache={} key={} reason={}", cacheName, key, e.getMessage());
        }
    }

    /** Clears every entry in a named cache (used for {@code page-list}, which keys by locale and limit). */
    private void clearCacheFully(String cacheName) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache == null) {
                log.warn("cache_clear_skipped cache={} reason=no_such_cache_registered", cacheName);
                return;
            }
            cache.clear();
            log.info("cache_cleared cache={}", cacheName);
        } catch (Exception e) {
            log.warn("cache_clear_failed cache={} reason={}", cacheName, e.getMessage());
        }
    }

    /**
     * Calls the Next.js on-demand revalidation endpoint for a single path.
     * Must be called from a background thread (it is not async itself).
     */
    private void revalidateFrontendPath(String path) {
        if (webAppUrl.isBlank() || revalidateSecret.isBlank()) {
            log.info(
                    "frontend_revalidation_skipped path={} webAppUrlConfigured={} revalidateSecretConfigured={}",
                    path,
                    !webAppUrl.isBlank(),
                    !revalidateSecret.isBlank());
            return;
        }

        String base = webAppUrl.stripTrailing();
        String encodedPath = URLEncoder.encode(path, StandardCharsets.UTF_8);
        String url = base + "/api/revalidate?secret=" + revalidateSecret + "&path=" + encodedPath;

        for (int attempt = 1; attempt <= REVALIDATE_MAX_ATTEMPTS; attempt++) {
            try {
                log.info(
                        "frontend_revalidation_attempt path={} attempt={}/{} targetHost={}",
                        path,
                        attempt,
                        REVALIDATE_MAX_ATTEMPTS,
                        safeHostForLog(base));
                // Explicit JSON body + Content-Length — POST with no body can confuse Node's HTTP stack
                // and yield an RST / empty response ("header parser received no bytes") from the JDK client.
                restClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{}")
                        .retrieve()
                        .toBodilessEntity();

                log.info("frontend_revalidation_ok path={} attempt={} targetHost={}", path, attempt, safeHostForLog(base));
                return;
            } catch (Exception e) {
                if (attempt == REVALIDATE_MAX_ATTEMPTS) {
                    // Non-fatal — ISR TTL will eventually pick up the change.
                    log.warn(
                            "frontend_revalidation_failed path={} attempts={} targetHost={} reason={}",
                            path,
                            REVALIDATE_MAX_ATTEMPTS,
                            safeHostForLog(base),
                            e.getMessage());
                    return;
                }
                log.info(
                        "frontend_revalidation_retry path={} afterAttempt={} waitMs={} reason={}",
                        path,
                        attempt,
                        REVALIDATE_RETRY_MS,
                        e.getMessage());
                try {
                    Thread.sleep(REVALIDATE_RETRY_MS);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.warn("frontend_revalidation_interrupted path={}", path);
                    return;
                }
            }
        }
    }

    private static String safeHostForLog(String webAppUrl) {
        if (webAppUrl == null || webAppUrl.isBlank()) {
            return "(blank)";
        }
        try {
            URI uri = URI.create(webAppUrl.stripTrailing());
            String host = uri.getHost();
            return host != null ? host : webAppUrl.stripTrailing();
        } catch (IllegalArgumentException e) {
            return "(invalid-url)";
        }
    }
}
