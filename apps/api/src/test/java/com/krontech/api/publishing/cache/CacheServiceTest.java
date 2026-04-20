package com.krontech.api.publishing.cache;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.service.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.web.client.RestClient;

/**
 * Unit tests for CacheService eviction logic.
 *
 * The key behaviors under test:
 *   1. evictContent always evicts from all relevant Spring caches synchronously (and clears {@code page-list}).
 *   2. Frontend revalidation (RestClient) is skipped when secret or URL is blank.
 *   3. A null cache returned by CacheManager (e.g. cache not configured) is handled gracefully.
 *
 * The async revalidation HTTP calls are tested at the "skip" level only — verifying that
 * RestClient is not touched when configuration is absent. Testing the actual HTTP call
 * would require mocking a multi-step RestClient chain and is left to integration tests.
 */
class CacheServiceTest {

    private final CacheManager cacheManager = mock(CacheManager.class);
    private final Cache        mockCache    = mock(Cache.class);
    private final RestClient   restClient   = mock(RestClient.class);
    private final PageRepository pageRepository = mock(PageRepository.class);

    @BeforeEach
    void setUp() {
        when(cacheManager.getCache(anyString())).thenReturn(mockCache);
    }

    // ── eviction ─────────────────────────────────────────────────────────────

    @Test
    void evictContent_shouldEvictAllRelevantCaches() {
        CacheService service = serviceWith("", "");

        service.evictContent("tr", "kron-pam");

        verify(cacheManager).getCache("pages");
        verify(cacheManager).getCache("blog-list");
        verify(cacheManager).getCache("blog-detail");
        verify(cacheManager).getCache("resource-list");
        verify(cacheManager).getCache("product-list");
        verify(cacheManager).getCache("page-list");

        // "kron-pam:tr" is used as the key for both "pages" and "blog-detail" (2 times)
        verify(mockCache, times(2)).evict("kron-pam:tr");
        // "tr" is used as the key for "blog-list", "resource-list", and "product-list" (3 times)
        verify(mockCache, times(3)).evict("tr");
        verify(mockCache, times(1)).clear();
    }

    @Test
    void evictContent_shouldEvictForEnLocale() {
        CacheService service = serviceWith("", "");

        service.evictContent("en", "home");

        verify(cacheManager).getCache("page-list");
        verify(mockCache, times(2)).evict("home:en");
        verify(mockCache, times(3)).evict("en");
        verify(mockCache, times(1)).clear();
    }

    // ── revalidation skip logic ───────────────────────────────────────────────

    @Test
    void evictContent_shouldNotCallRestClient_whenRevalidateSecretIsBlank() throws InterruptedException {
        CacheService service = serviceWith("http://localhost:3000", "");

        service.evictContent("tr", "kron-pam");

        // Allow the async task to complete before asserting
        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    @Test
    void evictContent_shouldNotCallRestClient_whenWebAppUrlIsBlank() throws InterruptedException {
        CacheService service = serviceWith("", "some-secret");

        service.evictContent("tr", "kron-pam");

        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    @Test
    void evictContent_shouldNotCallRestClient_whenBothConfigValuesAreBlank() throws InterruptedException {
        CacheService service = serviceWith("", "");

        service.evictContent("tr", "kron-pam");

        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    // ── null-cache safety ─────────────────────────────────────────────────────

    @Test
    void evictContent_shouldNotThrow_whenCacheManagerReturnsNull() {
        when(cacheManager.getCache(any())).thenReturn(null);
        CacheService service = serviceWith("", "");

        // Must not throw even when the cache does not exist in the CacheManager
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                () -> service.evictContent("tr", "kron-pam")
        );
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private CacheService serviceWith(String webAppUrl, String revalidateSecret) {
        return new CacheService(cacheManager, restClient, pageRepository, webAppUrl, revalidateSecret);
    }
}
