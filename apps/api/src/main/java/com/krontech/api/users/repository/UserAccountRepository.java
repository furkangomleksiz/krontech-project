package com.krontech.api.users.repository;

import com.krontech.api.users.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, java.util.UUID> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
}
