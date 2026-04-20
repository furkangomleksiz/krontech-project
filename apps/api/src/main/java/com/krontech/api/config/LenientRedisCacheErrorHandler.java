package com.krontech.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Swallows Redis cache I/O failures so read-through {@code @Cacheable} methods still return
 * their computed result when Redis is down or unreachable (common in local dev when Docker
 * Redis is not started). Errors are logged at WARN; eviction failures remain non-fatal for
 * {@link com.krontech.api.publishing.service.CacheService} as well.
 *
 * <p>When a GET fails because the stored bytes are not deserializable (for example a legacy
 * plain JSON array {@code []} instead of {@link org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer}
 * default-typing payload), this handler drops the corrupt entry so the next request can repopulate
 * Redis from the database instead of logging the same error on every hit.
 */
public final class LenientRedisCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(LenientRedisCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("cache_get_failed cache={} key={} reason={}", cache.getName(), key, exception.getMessage());
        try {
            cache.evict(key);
        } catch (RuntimeException evictEx) {
            log.warn(
                    "cache_evict_after_get_failure cache={} key={} reason={}",
                    cache.getName(),
                    key,
                    evictEx.getMessage());
        }
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("cache_put_failed cache={} key={} reason={}", cache.getName(), key, exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("cache_evict_failed cache={} key={} reason={}", cache.getName(), key, exception.getMessage());
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.warn("cache_clear_failed cache={} reason={}", cache.getName(), exception.getMessage());
    }
}
