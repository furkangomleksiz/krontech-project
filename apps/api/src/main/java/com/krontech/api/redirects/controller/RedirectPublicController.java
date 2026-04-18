package com.krontech.api.redirects.controller;

import com.krontech.api.redirects.dto.RedirectRuleResponse;
import com.krontech.api.redirects.service.RedirectService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Public (no-auth) redirect resolution endpoints.
 *
 * <p>These endpoints are consumed by the Next.js Edge Middleware — not by end users directly.
 *
 * <pre>
 * GET /api/v1/public/redirects
 *     Returns all active redirect rules as a flat JSON array.
 *     The middleware fetches this once and caches it in-process for 5 minutes.
 *     No pagination — redirect rule sets are expected to stay small (hundreds, not millions).
 *
 * GET /api/v1/public/redirects/resolve?path=/old-path
 *     Resolves a single path against active rules.
 *     Returns 200 + rule if a match is found, 404 otherwise.
 *     Useful for server-component catch-all pages and debugging.
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/public/redirects")
public class RedirectPublicController {

    private final RedirectService redirectService;

    public RedirectPublicController(RedirectService redirectService) {
        this.redirectService = redirectService;
    }

    /**
     * Bulk active rule list.
     * The Next.js middleware fetches this endpoint on cold start and caches it.
     */
    @GetMapping
    public List<RedirectRuleResponse> listActive() {
        return redirectService.listActive();
    }

    /**
     * Single-path resolution.
     * Returns HTTP 200 + the matching rule, or HTTP 404 if no active rule matches.
     */
    @GetMapping("/resolve")
    public RedirectRuleResponse resolve(@RequestParam String path) {
        return redirectService.resolve(path)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No active redirect rule for path: " + path));
    }
}
