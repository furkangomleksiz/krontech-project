package com.krontech.api.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.krontech.api.auth.service.JwtService;
import com.krontech.api.users.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for JwtService — the core authentication primitive.
 *
 * These tests directly exercise token generation and parsing without Spring context,
 * ensuring the contract (subject, issuer, role claim, expiry) is upheld.
 *
 * Why these tests matter: JWT bugs are silent in integration tests. A corrupted
 * role claim or wrong issuer would let requests pass security filters while
 * returning wrong authorization decisions downstream.
 */
class JwtServiceTest {

    // Minimum 256-bit key required by HS256
    private static final String SECRET = "test-secret-key-that-is-at-least-32-chars!!";
    private static final String ISSUER = "test-issuer";

    private JwtService jwt(long tokenMinutes) {
        return new JwtService(SECRET, ISSUER, tokenMinutes);
    }

    // ── generation & parsing ─────────────────────────────────────────────────

    @Test
    void generateToken_shouldProduceParseableToken_withCorrectClaims() {
        JwtService jwtService = jwt(60);
        String token = jwtService.generateToken("admin@example.com", UserRole.ADMIN);

        assertNotNull(token);

        Claims claims = jwtService.parseClaims(token);
        assertEquals("admin@example.com", claims.getSubject());
        assertEquals(ISSUER, claims.getIssuer());
        assertEquals("ADMIN", claims.get("role", String.class));
    }

    @Test
    void generateToken_shouldEmbedEditorRole_whenRoleIsEditor() {
        JwtService jwtService = jwt(60);
        String token = jwtService.generateToken("editor@example.com", UserRole.EDITOR);

        Claims claims = jwtService.parseClaims(token);
        assertEquals("EDITOR", claims.get("role", String.class));
    }

    @Test
    void tokenExpiresAt_shouldBeInTheFuture() {
        Instant before = Instant.now();
        Instant expiresAt = jwt(60).tokenExpiresAt();
        assertTrue(expiresAt.isAfter(before));
    }

    // ── verification failures ────────────────────────────────────────────────

    @Test
    void parseClaims_shouldThrowSignatureException_whenTokenSignedWithDifferentSecret() {
        JwtService signer   = jwt(60);
        JwtService verifier = new JwtService("completely-different-secret-that-is-32-chars!!", ISSUER, 60);

        String token = signer.generateToken("user@example.com", UserRole.EDITOR);

        assertThrows(SignatureException.class, () -> verifier.parseClaims(token));
    }

    @Test
    void parseClaims_shouldThrowExpiredJwtException_whenTokenHasExpired() {
        // tokenMinutes = 0 → expiry == issuedAt, so any real-time parse will find it expired
        JwtService jwtService = jwt(0);
        String token = jwtService.generateToken("user@example.com", UserRole.EDITOR);

        // Tiny pause ensures clock moves past the zero-duration expiry
        assertThrows(ExpiredJwtException.class, () -> {
            try { Thread.sleep(5); } catch (InterruptedException ignored) {}
            jwtService.parseClaims(token);
        });
    }
}
