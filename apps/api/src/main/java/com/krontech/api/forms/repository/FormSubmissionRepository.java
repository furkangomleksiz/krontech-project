package com.krontech.api.forms.repository;

import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.entity.FormType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormSubmissionRepository extends JpaRepository<FormSubmission, UUID> {

    /** Paginated listing filtered by form type, ordered by persistence layer default. */
    Page<FormSubmission> findByFormType(FormType formType, Pageable pageable);

    /** Full export ordered newest-first (no pagination — use with care on large datasets). */
    List<FormSubmission> findAllByOrderByCreatedAtDesc();

    /** Filtered export ordered newest-first. */
    List<FormSubmission> findByFormTypeOrderByCreatedAtDesc(FormType formType);
}
