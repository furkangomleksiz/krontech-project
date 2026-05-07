package com.krontech.api.config;

import com.krontech.api.config.properties.CorsProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Application-wide CORS policy.
 *
 * Allowed origins are controlled by the {@code CORS_ALLOWED_ORIGINS} environment variable
 * (comma-separated list). The default is {@code http://localhost:3000} for local development.
 *
 * Examples:
 *   CORS_ALLOWED_ORIGINS=http://localhost:3000
 *   CORS_ALLOWED_ORIGINS=http://localhost:3000,https://www.krontech.com.tr,https://admin.krontech.com.tr
 *
 * Spring Security delegates CORS evaluation to this configuration when
 * {@code .cors(Customizer.withDefaults())} is set in SecurityConfig.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties cors;

    public WebConfig(CorsProperties cors) {
        this.cors = cors;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = cors.allowedOrigins().split(",\\s*");

        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // Credentials (cookies) are not used — auth is header-based Bearer token.
                .allowCredentials(false)
                .maxAge(3600);
    }
}
