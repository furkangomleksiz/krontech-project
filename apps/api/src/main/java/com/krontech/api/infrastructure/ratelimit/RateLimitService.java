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
    private final int maxFormSubmissionsPerHour;
    private final Map<String, AtomicInteger> fallbackCounters = new ConcurrentHashMap<>();

    public RateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.max-requests-per-minute}") int maxRequestsPerMinute,
            @Value("${app.forms.rate-limit.max-per-hour:5}") int maxFormSubmissionsPerHour
    ) {
        this.redisTemplate = redisTemplate;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.maxFormSubmissionsPerHour = maxFormSubmissionsPerHour;
    }

    /** General per-IP:URI limit used by {@link RateLimitFilter}. */
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

    /**
     * Form-specific limit: at most {@code app.forms.rate-limit.max-per-hour} (default 5)
     * submissions per IP address per hour.
     * Fails open if Redis is unavailable so a Redis outage does not block all form traffic.
     */
    public boolean allowFormSubmission(String ip) {
        String redisKey = "form-submit:" + ip;
        try {
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1L) {
                redisTemplate.expire(redisKey, Duration.ofHours(1));
            }
            return count != null && count <= maxFormSubmissionsPerHour;
        } catch (Exception ignored) {
            return true;
        }
    }
}
