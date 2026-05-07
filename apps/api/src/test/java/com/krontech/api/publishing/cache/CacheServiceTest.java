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
 *   1. Each type-specific method evicts exactly the caches that belong to that type.
 *   2. No cross-type eviction — e.g. evictProduct must not touch blog-detail or resource-list.
 *   3. Frontend revalidation (RestClient) is skipped when secret or URL is blank.
 *   4. A null cache returned by CacheManager is handled gracefully.
 */
class CacheServiceTest {

    private final CacheManager    cacheManager    = mock(CacheManager.class);
    private final Cache           mockCache       = mock(Cache.class);
    private final RestClient      restClient      = mock(RestClient.class);
    private final PageRepository  pageRepository  = mock(PageRepository.class);

    @BeforeEach
    void setUp() {
        when(cacheManager.getCache(anyString())).thenReturn(mockCache);
    }

    // ── evictBlogPost ─────────────────────────────────────────────────────────

    @Test
    void evictBlogPost_shouldEvictBlogCaches() {
        CacheService service = serviceWith("", "");

        service.evictBlogPost("tr", "kron-pam");

        verify(cacheManager).getCache("pages");
        verify(cacheManager).getCache("blog-list");
        verify(cacheManager).getCache("blog-highlights");
        verify(cacheManager).getCache("blog-detail");
        verify(cacheManager).getCache("page-list");

        // "kron-pam:tr" is the key for both "pages" and "blog-detail"
        verify(mockCache, times(2)).evict("kron-pam:tr");
        // "tr" is the key for "blog-list" and "blog-highlights"
        verify(mockCache, times(2)).evict("tr");
        verify(mockCache, times(1)).clear();
    }

    @Test
    void evictBlogPost_shouldNotTouchProductOrResourceCaches() {
        CacheService service = serviceWith("", "");

        service.evictBlogPost("tr", "kron-pam");

        verify(cacheManager, never()).getCache("product-list");
        verify(cacheManager, never()).getCache("resource-list");
    }

    // ── evictProduct ──────────────────────────────────────────────────────────

    @Test
    void evictProduct_shouldEvictProductCaches() {
        CacheService service = serviceWith("", "");

        service.evictProduct("tr", "kron-pam");

        verify(cacheManager).getCache("pages");
        verify(cacheManager, times(2)).getCache("product-list");
        verify(cacheManager).getCache("page-list");

        verify(mockCache, times(1)).evict("kron-pam:tr");
        verify(mockCache, times(1)).evict("tr");
        verify(mockCache, times(1)).evict("en");
        verify(mockCache, times(1)).clear();
    }

    @Test
    void evictProduct_shouldNotTouchBlogOrResourceCaches() {
        CacheService service = serviceWith("", "");

        service.evictProduct("tr", "kron-pam");

        verify(cacheManager, never()).getCache("blog-list");
        verify(cacheManager, never()).getCache("blog-highlights");
        verify(cacheManager, never()).getCache("blog-detail");
        verify(cacheManager, never()).getCache("resource-list");
    }

    // ── evictResource ─────────────────────────────────────────────────────────

    @Test
    void evictResource_shouldEvictResourceCaches() {
        CacheService service = serviceWith("", "");

        service.evictResource("en", "datasheet-2025");

        verify(cacheManager).getCache("pages");
        verify(cacheManager).getCache("resource-list");
        verify(cacheManager).getCache("page-list");

        verify(mockCache, times(1)).evict("datasheet-2025:en");
        verify(mockCache, times(1)).evict("en");
        verify(mockCache, times(1)).clear();
    }

    @Test
    void evictResource_shouldNotTouchBlogOrProductCaches() {
        CacheService service = serviceWith("", "");

        service.evictResource("en", "datasheet-2025");

        verify(cacheManager, never()).getCache("blog-list");
        verify(cacheManager, never()).getCache("blog-highlights");
        verify(cacheManager, never()).getCache("blog-detail");
        verify(cacheManager, never()).getCache("product-list");
    }

    // ── evictPage ─────────────────────────────────────────────────────────────

    @Test
    void evictPage_shouldEvictPageCaches() {
        CacheService service = serviceWith("", "");

        service.evictPage("en", "home");

        verify(cacheManager).getCache("pages");
        verify(cacheManager).getCache("page-list");

        verify(mockCache, times(1)).evict("home:en");
        verify(mockCache, times(1)).clear();
    }

    @Test
    void evictPage_shouldNotTouchBlogProductOrResourceCaches() {
        CacheService service = serviceWith("", "");

        service.evictPage("en", "home");

        verify(cacheManager, never()).getCache("blog-list");
        verify(cacheManager, never()).getCache("blog-highlights");
        verify(cacheManager, never()).getCache("blog-detail");
        verify(cacheManager, never()).getCache("product-list");
        verify(cacheManager, never()).getCache("resource-list");
    }

    // ── revalidation skip logic ───────────────────────────────────────────────

    @Test
    void evictBlogPost_shouldNotCallRestClient_whenRevalidateSecretIsBlank() throws InterruptedException {
        CacheService service = serviceWith("http://localhost:3000", "");

        service.evictBlogPost("tr", "kron-pam");

        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    @Test
    void evictProduct_shouldNotCallRestClient_whenWebAppUrlIsBlank() throws InterruptedException {
        CacheService service = serviceWith("", "some-secret");

        service.evictProduct("tr", "kron-pam");

        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    @Test
    void evictResource_shouldNotCallRestClient_whenBothConfigValuesAreBlank() throws InterruptedException {
        CacheService service = serviceWith("", "");

        service.evictResource("tr", "kron-pam");

        Thread.sleep(150);

        verify(restClient, never()).post();
    }

    // ── null-cache safety ─────────────────────────────────────────────────────

    @Test
    void evictBlogPost_shouldNotThrow_whenCacheManagerReturnsNull() {
        when(cacheManager.getCache(any())).thenReturn(null);
        CacheService service = serviceWith("", "");

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                () -> service.evictBlogPost("tr", "kron-pam")
        );
    }

    @Test
    void evictProduct_shouldNotThrow_whenCacheManagerReturnsNull() {
        when(cacheManager.getCache(any())).thenReturn(null);
        CacheService service = serviceWith("", "");

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                () -> service.evictProduct("tr", "kron-pam")
        );
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private CacheService serviceWith(String webAppUrl, String revalidateSecret) {
        return new CacheService(cacheManager, restClient, pageRepository, webAppUrl, revalidateSecret);
    }
}
