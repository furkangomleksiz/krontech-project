package com.krontech.api.users.dto;

import com.krontech.api.users.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Email @Size(max = 200) String email,
        @NotBlank @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters.") String password,
        @NotNull UserRole role
) {
}
