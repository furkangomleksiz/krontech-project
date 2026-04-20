-- Audit trail for admin actions (matches com.krontech.api.audit.entity.AuditLog + BaseEntity).
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actor VARCHAR(200) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id UUID,
    target_slug VARCHAR(500),
    details VARCHAR(4000)
);
