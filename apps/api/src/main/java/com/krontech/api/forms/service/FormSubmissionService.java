package com.krontech.api.forms.service;

import com.krontech.api.forms.dto.FormSubmissionRequest;
import com.krontech.api.forms.dto.FormSubmissionResponse;
import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.repository.FormSubmissionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ValidationException;
import org.springframework.stereotype.Service;

@Service
public class FormSubmissionService {

    private final FormSubmissionRepository formSubmissionRepository;

    public FormSubmissionService(FormSubmissionRepository formSubmissionRepository) {
        this.formSubmissionRepository = formSubmissionRepository;
    }

    public FormSubmissionResponse save(FormSubmissionRequest request, HttpServletRequest httpRequest) {
        if (!request.consentAccepted()) {
            throw new ValidationException("Consent must be accepted before submitting the form.");
        }

        FormSubmission submission = new FormSubmission();
        submission.setFormType(request.formType());
        submission.setFullName(request.fullName());
        submission.setEmail(request.email());
        submission.setCompany(request.company());
        submission.setPhone(request.phone());
        submission.setJobTitle(request.jobTitle());
        submission.setMessage(request.message());
        submission.setConsentAccepted(true);
        submission.setSourcePage(request.sourcePage());
        submission.setIpAddress(httpRequest.getRemoteAddr());

        FormSubmission created = formSubmissionRepository.save(submission);
        return new FormSubmissionResponse(created.getId(), "RECEIVED");
    }
}
