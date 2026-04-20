-- Align with JPA: details is optional (some DBs had NOT NULL from earlier Hibernate ddl-auto).
ALTER TABLE audit_logs
    ALTER COLUMN details DROP NOT NULL;
