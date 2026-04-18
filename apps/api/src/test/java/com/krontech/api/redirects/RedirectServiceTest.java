package com.krontech.api.redirects;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.common.entity.BaseEntity;
import com.krontech.api.redirects.dto.RedirectRuleRequest;
import com.krontech.api.redirects.dto.RedirectRuleResponse;
import com.krontech.api.redirects.entity.RedirectRule;
import com.krontech.api.redirects.repository.RedirectRuleRepository;
import com.krontech.api.redirects.service.RedirectService;
import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

/**
 * Unit tests for RedirectService business logic.
 *
 * Focus areas:
 *   - Conflict detection on create and update (duplicate sourcePath)
 *   - Correct update semantics (same rule vs. different rule)
 *   - Toggle flips active flag without touching other fields
 *   - Resolve returns empty for inactive or missing rules
 */
class RedirectServiceTest {

    private final RedirectRuleRepository repository = mock(RedirectRuleRepository.class);
    private final RedirectService service = new RedirectService(repository);

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_shouldSaveAndReturnRule() {
        RedirectRuleRequest req = new RedirectRuleRequest("/old-path", "/tr/new-path", 301, true, null);
        when(repository.findBySourcePath("/old-path")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedirectRuleResponse result = service.create(req);

        assertEquals("/old-path", result.sourcePath());
        assertEquals("/tr/new-path", result.targetPath());
        assertEquals(301, result.statusCode());
        verify(repository).save(any(RedirectRule.class));
    }

    @Test
    void create_shouldThrow409_whenSourcePathAlreadyExists() {
        RedirectRule existing = rule("/old-path", "/somewhere", 301);
        when(repository.findBySourcePath("/old-path")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.create(new RedirectRuleRequest("/old-path", "/tr/new", 301, true, null)));

        assertEquals(409, ex.getStatusCode().value());
        verify(repository, never()).save(any());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_shouldAllowKeepingSameSourcePath() {
        // Updating a rule to keep its own source path must not be treated as a conflict:
        // findBySourcePath returns the SAME rule (same id), so !existing.getId().equals(id) is false.
        UUID id = UUID.randomUUID();
        RedirectRule ruleA = ruleWithId(id, "/path-a", "/tr/target", 301);
        when(repository.findById(id)).thenReturn(Optional.of(ruleA));
        when(repository.findBySourcePath("/path-a")).thenReturn(Optional.of(ruleA));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.update(id,
                new RedirectRuleRequest("/path-a", "/tr/updated-target", 302, true, "migration")));
    }

    @Test
    void update_shouldThrow409_whenSourcePathBelongsToDifferentRule() {
        UUID ruleAId = UUID.randomUUID();
        UUID ruleBId = UUID.randomUUID();
        RedirectRule ruleA = ruleWithId(ruleAId, "/path-a", "/tr/a", 301);
        RedirectRule ruleB = ruleWithId(ruleBId, "/path-b", "/tr/b", 301);

        when(repository.findById(ruleAId)).thenReturn(Optional.of(ruleA));
        // Trying to move ruleA's sourcePath to "/path-b" which is already used by ruleB (different id)
        when(repository.findBySourcePath("/path-b")).thenReturn(Optional.of(ruleB));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update(ruleAId,
                        new RedirectRuleRequest("/path-b", "/tr/new-target", 301, true, null)));

        assertEquals(409, ex.getStatusCode().value());
    }

    // ── toggle ────────────────────────────────────────────────────────────────

    @Test
    void toggle_shouldFlipActiveFromTrueToFalse() {
        UUID id = UUID.randomUUID();
        RedirectRule r = rule("/path", "/tr/target", 301);
        r.setActive(true);
        when(repository.findById(id)).thenReturn(Optional.of(r));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedirectRuleResponse result = service.toggle(id);

        assertFalse(result.active());
    }

    @Test
    void toggle_shouldFlipActiveFromFalseToTrue() {
        UUID id = UUID.randomUUID();
        RedirectRule r = rule("/path", "/tr/target", 302);
        r.setActive(false);
        when(repository.findById(id)).thenReturn(Optional.of(r));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RedirectRuleResponse result = service.toggle(id);

        assertTrue(result.active());
    }

    // ── resolve ───────────────────────────────────────────────────────────────

    @Test
    void resolve_shouldReturnEmpty_whenNoRuleMatchesPath() {
        when(repository.findBySourcePathAndActiveTrue("/nonexistent")).thenReturn(Optional.empty());

        assertTrue(service.resolve("/nonexistent").isEmpty());
    }

    @Test
    void resolve_shouldReturnRule_whenActiveRuleMatches() {
        RedirectRule r = rule("/legacy-path", "/tr/new-path", 301);
        when(repository.findBySourcePathAndActiveTrue("/legacy-path")).thenReturn(Optional.of(r));

        Optional<RedirectRuleResponse> result = service.resolve("/legacy-path");

        assertTrue(result.isPresent());
        assertEquals("/legacy-path", result.get().sourcePath());
        assertEquals("/tr/new-path", result.get().targetPath());
        assertEquals(301, result.get().statusCode());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Creates a RedirectRule with null id (sufficient for tests that don't compare ids). */
    private static RedirectRule rule(String source, String target, int code) {
        RedirectRule r = new RedirectRule();
        r.setSourcePath(source);
        r.setTargetPath(target);
        r.setStatusCode(code);
        r.setActive(true);
        return r;
    }

    /**
     * Creates a RedirectRule with an explicitly set id.
     * Required for update tests that compare existing.getId() to the update target id.
     * Uses reflection because BaseEntity.id is managed by JPA @GeneratedValue.
     */
    private static RedirectRule ruleWithId(UUID id, String source, String target, int code) {
        RedirectRule r = rule(source, target, code);
        try {
            Field field = BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(r, id);
        } catch (Exception e) {
            throw new RuntimeException("Could not set id via reflection", e);
        }
        return r;
    }
}
