package com.krontech.api.config;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;

class LenientRedisCacheErrorHandlerTest {

    @Test
    void handleCacheGetError_evictsKeySoCorruptPayloadDoesNotStick() {
        Cache cache = mock(Cache.class);
        when(cache.getName()).thenReturn("product-list");

        LenientRedisCacheErrorHandler handler = new LenientRedisCacheErrorHandler();
        handler.handleCacheGetError(new RuntimeException("Could not read JSON"), cache, "tr");

        verify(cache).evict("tr");
    }
}
