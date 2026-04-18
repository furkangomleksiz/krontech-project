package com.krontech.api.users.dto;

import com.krontech.api.users.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull UserRole role
) {
}
