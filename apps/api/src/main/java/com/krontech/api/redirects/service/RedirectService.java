package com.krontech.api.redirects.service;

import com.krontech.api.redirects.dto.RedirectRuleRequest;
import com.krontech.api.redirects.dto.RedirectRuleResponse;
import com.krontech.api.redirects.entity.RedirectRule;
import com.krontech.api.redirects.repository.RedirectRuleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RedirectService {

    private final RedirectRuleRepository repository;

    public RedirectService(RedirectRuleRepository repository) {
        this.repository = repository;
    }

    // ── Public resolution ─────────────────────────────────────────────────────

    /**
     * Looks up an active redirect rule for the given path.
     * Returns empty if no active rule matches (caller should fall through to normal routing).
     */
    public Optional<RedirectRuleResponse> resolve(String path) {
        return repository.findBySourcePathAndActiveTrue(path).map(this::toResponse);
    }

    /**
     * Returns all active redirect rules, ordered by source path.
     * Used by the Next.js Edge Middleware to build its in-memory cache.
     * The response is intentionally not paginated — redirect rule sets are expected
     * to be in the hundreds, not tens of thousands, and the middleware needs the full list.
     */
    public List<RedirectRuleResponse> listActive() {
        return repository.findAllByActiveTrueOrderBySourcePath()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    public Page<RedirectRuleResponse> list(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public RedirectRuleResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public RedirectRuleResponse create(RedirectRuleRequest request) {
        // Reject duplicate source paths regardless of active status — a deactivated rule
        // blocking a new one is intentional (it preserves the audit trail).
        repository.findBySourcePath(request.sourcePath()).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A redirect rule for '" + request.sourcePath() + "' already exists (id: " + existing.getId() + "). "
                    + "Update or delete the existing rule first.");
        });

        RedirectRule rule = new RedirectRule();
        apply(rule, request);
        return toResponse(repository.save(rule));
    }

    public RedirectRuleResponse update(UUID id, RedirectRuleRequest request) {
        RedirectRule rule = findOrThrow(id);

        // Allow updating to the same source path (no-op conflict); reject if it belongs to a different rule.
        repository.findBySourcePath(request.sourcePath()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Source path '" + request.sourcePath() + "' is already used by rule id: " + existing.getId());
            }
        });

        apply(rule, request);
        return toResponse(repository.save(rule));
    }

    /**
     * Flips the {@code active} flag without changing any other field.
     * This is the preferred way to temporarily disable a rule without losing it.
     */
    public RedirectRuleResponse toggle(UUID id) {
        RedirectRule rule = findOrThrow(id);
        rule.setActive(!rule.isActive());
        return toResponse(repository.save(rule));
    }

    public void delete(UUID id) {
        repository.delete(findOrThrow(id));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private RedirectRule findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Redirect rule not found: " + id));
    }

    private static void apply(RedirectRule rule, RedirectRuleRequest req) {
        rule.setSourcePath(req.sourcePath().strip());
        rule.setTargetPath(req.targetPath().strip());
        rule.setStatusCode(req.statusCode());
        rule.setActive(req.active());
        rule.setNotes(req.notes());
    }

    private RedirectRuleResponse toResponse(RedirectRule rule) {
        return new RedirectRuleResponse(
                rule.getId(),
                rule.getSourcePath(),
                rule.getTargetPath(),
                rule.getStatusCode(),
                rule.isActive(),
                rule.getNotes(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
