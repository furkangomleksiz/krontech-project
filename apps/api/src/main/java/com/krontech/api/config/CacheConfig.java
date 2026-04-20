package com.krontech.api.config;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.web.client.RestClient;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.http.client.JdkClientHttpRequestFactory;

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
 *   blog-highlights — curated blog sidebar (per locale) 10 min
 *   blog-detail   — blog post detail                  20 min
 *   resource-list — resource listing (per locale)     10 min
 *   product-list  — published products (per locale)    10 min
 *   page-list     — published CMS pages strip (per locale + limit) 10 min
 * </pre>
 *
 * <h2>Invalidation</h2>
 * {@link com.krontech.api.publishing.service.CacheService#evictContent} is called on every
 * publish/unpublish transition and evicts all affected cache entries via Spring's
 * {@code CacheManager}. It also triggers asynchronous on-demand ISR revalidation on the
 * Next.js frontend so the browser-visible HTML is refreshed immediately.
 *
 * <h2>If Redis is unavailable</h2>
 * {@link LenientRedisCacheErrorHandler} ensures {@code @Cacheable} methods still complete
 * (read-through from DB) when Redis GET/PUT throws. Eviction also stays non-fatal.
 * Rate-limit counters (in {@link com.krontech.api.infrastructure.ratelimit.RateLimitService})
 * use a separate {@code StringRedisTemplate} and fail independently.
 */
@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    /**
     * Default TTL applied to any cache name not explicitly listed in
     * {@code perCacheConfigs}.
     */
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);

    /**
     * Shared RestClient for on-demand ISR revalidation calls from {@link com.krontech.api.publishing.service.CacheService}.
     * <p>
     * Uses JDK {@link HttpClient} pinned to <strong>HTTP/1.1</strong> — the default JDK client can negotiate
     * in ways that leave Node's HTTP server with an empty read, which surfaces in Java as
     * {@code HTTP/1.1 header parser received no bytes} when talking to {@code next start} inside Docker.
     */
    @Bean
    public RestClient revalidationRestClient() {
        HttpClient jdkHttpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(8))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(jdkHttpClient);
        return RestClient.builder().requestFactory(requestFactory).build();
    }

    @Bean
    @Override
    public CacheErrorHandler errorHandler() {
        return new LenientRedisCacheErrorHandler();
    }

    /**
     * Redis {@link CacheManager} bean (not an override of {@link CachingConfigurer#cacheManager()} —
     * that default method takes no arguments in Spring Framework 6).
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Use the no-arg serializer so Spring Data Redis applies its default typing setup (required
        // to round-trip @Cacheable return types). Passing a bare Spring ObjectMapper breaks that and
        // can deserialize cache entries as wrong shapes → empty lists on the public site.
        // JavaTimeModule fixes Instant etc. on PUT without dropping default typing.
        GenericJackson2JsonRedisSerializer redisSerializer = new GenericJackson2JsonRedisSerializer();
        redisSerializer.configure(mapper -> {
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        });
        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(DEFAULT_TTL)
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(redisSerializer)
                )
                .disableCachingNullValues();

        // Per-cache TTL overrides — shorter for lists (new items must appear quickly);
        // longer for article detail (published content rarely changes after first publish).
        Map<String, RedisCacheConfiguration> perCacheConfigs = new HashMap<>();
        perCacheConfigs.put("pages",         base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("blog-list",     base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("blog-detail",   base.entryTtl(Duration.ofMinutes(20)));
        perCacheConfigs.put("resource-list", base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("product-list", base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("page-list", base.entryTtl(Duration.ofMinutes(10)));
        perCacheConfigs.put("blog-highlights", base.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(base)
                .withInitialCacheConfigurations(perCacheConfigs)
                .build();
    }
}
