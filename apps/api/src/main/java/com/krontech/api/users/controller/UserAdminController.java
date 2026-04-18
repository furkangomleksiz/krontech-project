package com.krontech.api.users.controller;

import com.krontech.api.users.dto.CreateUserRequest;
import com.krontech.api.users.dto.UpdateUserRoleRequest;
import com.krontech.api.users.dto.UserAdminResponse;
import com.krontech.api.users.service.UserAdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * User management endpoints. All operations restricted to ADMIN role.
 *
 * GET  /api/v1/admin/users              — list all users
 * POST /api/v1/admin/users              — create a new user
 * PATCH /api/v1/admin/users/{id}/role   — change role
 * PATCH /api/v1/admin/users/{id}/deactivate — deactivate (soft delete)
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<UserAdminResponse> list() {
        return userAdminService.list();
    }

    @PostMapping
    public ResponseEntity<UserAdminResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userAdminService.create(request));
    }

    @PatchMapping("/{id}/role")
    public UserAdminResponse updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return userAdminService.updateRole(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        userAdminService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
