package com.krontech.api.auth.config;

import com.krontech.api.auth.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthBootstrapConfig {

    @Bean
    CommandLineRunner bootstrapUsers(AuthService authService) {
        return args -> authService.createDefaultUsersIfMissing();
    }
}
