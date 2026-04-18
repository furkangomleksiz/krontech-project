package com.krontech.api.publishing.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Centralises all Redis cache key patterns and eviction logic.
 *
 * Key conventions (mirrors what the Next.js frontend caches under ISR):
 *   cache:page:{locale}:{slug}        — any content type detail page
 *   cache:blog:list:{locale}          — blog post list (paginated)
 *   cache:resource:list:{locale}      — resource list (paginated)
 *
 * Why wipe list caches on individual publishes?
 * A newly published item must appear in the list immediately. Because we can't
 * cheaply know whether the item belongs to a list cache, we evict all list caches
 * for the locale on every publish/unpublish transition. The list TTL is short
 * enough that this is safe and inexpensive.
 */
@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    private final StringRedisTemplate redis;

    public CacheService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Evicts all cache entries related to a content item.
     * Safe to call even when the item is not cached (Redis DEL on a missing key is a no-op).
     *
     * @param locale lower-case locale code, e.g. "en" or "tr"
     * @param slug   the page slug
     */
    public void evictContent(String locale, String slug) {
        delete("cache:page:" + locale + ":" + slug);
        delete("cache:blog:list:" + locale);
        delete("cache:resource:list:" + locale);
    }

    private void delete(String key) {
        try {
            redis.delete(key);
            log.debug("cache_evicted key={}", key);
        } catch (Exception e) {
            // Cache eviction failure must not block the publish flow.
            // Log and continue; next request will re-populate from DB.
            log.warn("cache_evict_failed key={} reason={}", key, e.getMessage());
        }
    }
}
