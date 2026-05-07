package com.krontech.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan("com.krontech.api.config.properties")
public class KrontechApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(KrontechApiApplication.class, args);
    }
}
