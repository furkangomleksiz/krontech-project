package com.krontech.api.users.service;

import com.krontech.api.users.dto.CreateUserRequest;
import com.krontech.api.users.dto.UpdateUserRoleRequest;
import com.krontech.api.users.dto.UserAdminResponse;
import com.krontech.api.users.entity.UserAccount;
import com.krontech.api.users.repository.UserAccountRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserAdminService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserAdminResponse> list() {
        return userAccountRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserAdminResponse create(CreateUserRequest request) {
        if (userAccountRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with that email already exists.");
        }
        UserAccount user = new UserAccount();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setActive(true);
        return toResponse(userAccountRepository.save(user));
    }

    public UserAdminResponse updateRole(UUID id, UpdateUserRoleRequest request) {
        UserAccount user = findOrThrow(id);
        user.setRole(request.role());
        return toResponse(userAccountRepository.save(user));
    }

    public void deactivate(UUID id) {
        UserAccount user = findOrThrow(id);
        user.setActive(false);
        userAccountRepository.save(user);
    }

    private UserAccount findOrThrow(UUID id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private UserAdminResponse toResponse(UserAccount user) {
        return new UserAdminResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
