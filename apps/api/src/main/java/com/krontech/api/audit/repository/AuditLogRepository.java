package com.krontech.api.audit.repository;

import com.krontech.api.audit.entity.AuditLog;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByTargetIdOrderByCreatedAtDesc(UUID targetId, Pageable pageable);

    Page<AuditLog> findByActorOrderByCreatedAtDesc(String actor, Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);
}
