package com.krontech.api.auth.service;

import com.krontech.api.users.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final String issuer;
    private final long tokenMinutes;

    public JwtService(
            @Value("${app.auth.secret}") String secret,
            @Value("${app.auth.issuer}") String issuer,
            @Value("${app.auth.access-token-minutes}") long tokenMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.tokenMinutes = tokenMinutes;
    }

    public String generateToken(String subject, UserRole role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(tokenMinutes * 60);

        return Jwts.builder()
                .issuer(issuer)
                .subject(subject)
                .claim("role", role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
