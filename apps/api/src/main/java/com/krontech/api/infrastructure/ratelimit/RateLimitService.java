package com.krontech.api.infrastructure.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {

    private final StringRedisTemplate redisTemplate;
    private final int maxRequestsPerMinute;
    private final Map<String, AtomicInteger> fallbackCounters = new ConcurrentHashMap<>();

    public RateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.max-requests-per-minute}") int maxRequestsPerMinute
    ) {
        this.redisTemplate = redisTemplate;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }

    public boolean allow(String key) {
        String redisKey = "rate:" + key;
        try {
            Long current = redisTemplate.opsForValue().increment(redisKey);
            if (current != null && current == 1L) {
                redisTemplate.expire(redisKey, Duration.ofMinutes(1));
            }
            return current != null && current <= maxRequestsPerMinute;
        } catch (Exception ignored) {
            // In-memory fallback: counters never expire and grow with distinct keys.
            // Acceptable for local dev; if Redis is required in production, fail-open should be revisited.
            int value = fallbackCounters.computeIfAbsent(key, k -> new AtomicInteger()).incrementAndGet();
            return value <= maxRequestsPerMinute;
        }
    }
}
