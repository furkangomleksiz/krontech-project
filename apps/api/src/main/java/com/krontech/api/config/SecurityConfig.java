package com.krontech.api.config;

import com.krontech.api.auth.security.JwtAuthenticationFilter;
import com.krontech.api.infrastructure.ratelimit.RateLimitFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Delegate CORS pre-flight and header handling to WebConfig.addCorsMappings().
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                // Without this, a missing/invalid JWT leaves the anonymous principal in the context,
                // so secured routes return 403 (access denied) instead of 401 (unauthenticated).
                .anonymous(anonymous -> anonymous.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/public/**",
                                "/api/v1/preview/**",
                                "/api/v1/forms/**",
                                "/api/v1/auth/login",
                                "/swagger-ui/**",
                                "/api-docs/**"
                                // /api/v1/public/redirects/** is covered by /api/v1/public/**
                        )
                        .permitAll()
                        .anyRequest()
                        .hasAnyRole("ADMIN", "EDITOR")
                )
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtAuthenticationFilter, RateLimitFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
