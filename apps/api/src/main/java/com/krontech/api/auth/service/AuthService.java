package com.krontech.api.auth.service;

import com.krontech.api.auth.dto.LoginRequest;
import com.krontech.api.auth.dto.TokenResponse;
import com.krontech.api.users.entity.UserAccount;
import com.krontech.api.users.entity.UserRole;
import com.krontech.api.users.repository.UserAccountRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public TokenResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new TokenResponse(token, "Bearer", user.getRole().name());
    }

    public void createDefaultUsersIfMissing() {
        createUserIfMissing("admin@krontech.local", "Admin123!", UserRole.ADMIN);
        createUserIfMissing("editor@krontech.local", "Editor123!", UserRole.EDITOR);
    }

    private void createUserIfMissing(String email, String rawPassword, UserRole role) {
        if (userAccountRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(true);
        userAccountRepository.save(user);
    }
}
