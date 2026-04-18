package com.krontech.api.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.auth.dto.LoginRequest;
import com.krontech.api.auth.dto.TokenResponse;
import com.krontech.api.auth.service.AuthService;
import com.krontech.api.auth.service.JwtService;
import com.krontech.api.users.entity.UserAccount;
import com.krontech.api.users.entity.UserRole;
import com.krontech.api.users.repository.UserAccountRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

/**
 * Unit tests for the login flow and default user bootstrapping.
 *
 * Uses a real BCryptPasswordEncoder (not mocked) to verify that the correct
 * password actually matches the stored hash — mocking the encoder would make
 * the test useless since the real encoder is used in production.
 */
class AuthServiceTest {

    private static final String JWT_SECRET = "test-secret-key-that-is-at-least-32-chars!!";

    private final UserAccountRepository repo     = mock(UserAccountRepository.class);
    private final PasswordEncoder        encoder  = new BCryptPasswordEncoder();
    private final JwtService             jwt      = new JwtService(JWT_SECRET, "test", 60);
    private final AuthService            service  = new AuthService(repo, encoder, jwt);

    // ── login — happy path ───────────────────────────────────────────────────

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {
        String rawPassword = "Secure123!";
        UserAccount user = activeUser("admin@example.com", rawPassword, UserRole.ADMIN);
        when(repo.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(user));

        TokenResponse resp = service.login(new LoginRequest("admin@example.com", rawPassword));

        assertNotNull(resp.accessToken());
        assertEquals("ADMIN", resp.role());
        assertEquals("admin@example.com", resp.email());
    }

    // ── login — failure paths ────────────────────────────────────────────────

    @Test
    void login_shouldThrowBadCredentials_whenPasswordIsWrong() {
        UserAccount user = activeUser("admin@example.com", "correct-password", UserRole.ADMIN);
        when(repo.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadCredentialsException.class,
                () -> service.login(new LoginRequest("admin@example.com", "wrong-password")));
    }

    @Test
    void login_shouldThrowBadCredentials_whenUserDoesNotExist() {
        when(repo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> service.login(new LoginRequest("nobody@example.com", "any-password")));
    }

    @Test
    void login_shouldThrowBadCredentials_whenUserIsInactive() {
        // Inactive users must not be able to log in even with the correct password.
        UserAccount user = activeUser("admin@example.com", "correct-password", UserRole.ADMIN);
        user.setActive(false);
        when(repo.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadCredentialsException.class,
                () -> service.login(new LoginRequest("admin@example.com", "correct-password")));
    }

    // ── me ───────────────────────────────────────────────────────────────────

    @Test
    void me_shouldThrowUnauthorized_whenUserNotFound() {
        when(repo.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.me("ghost@example.com"));
        assertEquals(401, ex.getStatusCode().value());
    }

    // ── bootstrap ────────────────────────────────────────────────────────────

    @Test
    void createDefaultUsersIfMissing_shouldNotSaveWhenUsersAlreadyExist() {
        UserAccount existingAdmin = activeUser("admin@krontech.local", "Admin123!", UserRole.ADMIN);
        when(repo.findByEmailIgnoreCase("admin@krontech.local"))
                .thenReturn(Optional.of(existingAdmin));
        when(repo.findByEmailIgnoreCase("editor@krontech.local"))
                .thenReturn(Optional.of(activeUser("editor@krontech.local", "Editor123!", UserRole.EDITOR)));

        service.createDefaultUsersIfMissing();

        verify(repo, never()).save(any());
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private UserAccount activeUser(String email, String rawPassword, UserRole role) {
        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(true);
        return user;
    }
}
