package com.krontech.api.auth.controller;

import com.krontech.api.auth.dto.LoginRequest;
import com.krontech.api.auth.dto.MeResponse;
import com.krontech.api.auth.dto.TokenResponse;
import com.krontech.api.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Returns the profile of the currently authenticated user. Requires a valid JWT. */
    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.me(authentication.getName()));
    }
}

