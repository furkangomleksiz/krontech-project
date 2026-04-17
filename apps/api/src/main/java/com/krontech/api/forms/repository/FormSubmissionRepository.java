package com.krontech.api.forms.repository;

import com.krontech.api.forms.entity.FormSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormSubmissionRepository extends JpaRepository<FormSubmission, java.util.UUID> {
}
