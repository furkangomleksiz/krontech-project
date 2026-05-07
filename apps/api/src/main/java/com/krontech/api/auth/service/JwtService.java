package com.krontech.api.auth.service;

import com.krontech.api.config.properties.AuthProperties;
import com.krontech.api.users.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final String issuer;
    private final long tokenMinutes;

    public JwtService(AuthProperties auth) {
        this.secretKey = Keys.hmacShaKeyFor(auth.secret().getBytes(StandardCharsets.UTF_8));
        this.issuer = auth.issuer();
        this.tokenMinutes = auth.accessTokenMinutes();
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

    /** Returns the expiry instant for a token issued right now. */
    public Instant tokenExpiresAt() {
        return Instant.now().plusSeconds(tokenMinutes * 60);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
