package com.krontech.api.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.web.client.RestClient;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

/**
 * Redis-backed Spring Cache configuration.
 *
 * <h2>Rationale</h2>
 * Public content endpoints ({@code /public/**}) are read-heavy and change infrequently.
 * A short-lived Redis cache in front of PostgreSQL reduces DB round-trips on every
 * ISR revalidation burst without requiring complex infrastructure.
 *
 * <h2>Cache names and TTLs</h2>
 *
 * <pre>
 *   pages         — generic page + content blocks    10 min
 *   blog-list     — blog post list (per locale)       10 min
 *   blog-detail   — blog post detail                  20 min
 *   resource-list — resource listing (per locale)     10 min
 * </pre>
 *
 * <h2>Invalidation</h2>
 * {@link com.krontech.api.publishing.service.CacheService#evictContent} is called on every
 * publish/unpublish transition and evicts all affected cache entries via Spring's
 * {@code CacheManager}. It also triggers asynchronous on-demand ISR revalidation on the
 * Next.js frontend so the browser-visible HTML is refreshed immediately.
 *
 * <h2>If Redis is unavailable</h2>
 * Spring's cache abstraction fails gracefully: {@code @Cacheable} method calls fall through
 * to the actual service method; {@code cache.evict()} logs a warning and continues.
 * Rate-limit counters (in {@link com.krontech.api.infrastructure.ratelimit.RateLimitService})
 * use a separate {@code StringRedisTemplate} and fail independently.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Default TTL applied to any cache name not explicitly listed in
     * {@code perCacheConfigs}.
     */
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);

    /**
     * Shared RestClient for on-demand ISR revalidation calls from {@link com.krontech.api.publishing.service.CacheService}.
     * A single bean keeps connection pool and timeout settings in one place.
     */
    @Bean
    public RestClient revalidationRestClient() {
        return RestClient.create();
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(DEFAULT_TTL)
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()
                        )
                )
                .disableCachingNullValues();

        // Per-cache TTL overrides — shorter for lists (new items must appear quickly);
        // longer for article detail (published content rarely changes after first publish).
        Map<String, RedisCacheConfiguration> perCacheConfigs = new HashMap<>();
        perCacheConfigs.put("pages",         base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("blog-list",     base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("blog-detail",   base.entryTtl(Duration.ofMinutes(20)));
        perCacheConfigs.put("resource-list", base.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(base)
                .withInitialCacheConfigurations(perCacheConfigs)
                .build();
    }
}
