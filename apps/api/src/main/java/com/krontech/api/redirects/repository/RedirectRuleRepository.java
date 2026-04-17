package com.krontech.api.redirects.repository;

import com.krontech.api.redirects.entity.RedirectRule;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RedirectRuleRepository extends JpaRepository<RedirectRule, UUID> {
    Optional<RedirectRule> findBySourcePath(String sourcePath);
}
