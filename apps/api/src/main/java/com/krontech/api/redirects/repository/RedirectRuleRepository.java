package com.krontech.api.redirects.repository;

import com.krontech.api.redirects.entity.RedirectRule;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RedirectRuleRepository extends JpaRepository<RedirectRule, UUID> {

    /** Used by the admin to check for duplicate source paths. */
    Optional<RedirectRule> findBySourcePath(String sourcePath);

    /** Used for middleware resolution — only active rules are considered. */
    Optional<RedirectRule> findBySourcePathAndActiveTrue(String sourcePath);

    /** Bulk load for middleware cache — returns all active rules ordered by source path. */
    List<RedirectRule> findAllByActiveTrueOrderBySourcePath();
}
