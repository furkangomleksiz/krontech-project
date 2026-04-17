package com.krontech.api.forms.controller;

import com.krontech.api.forms.dto.FormSubmissionAdminResponse;
import com.krontech.api.forms.entity.FormSubmission;
import com.krontech.api.forms.entity.FormType;
import com.krontech.api.forms.repository.FormSubmissionRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only endpoints for viewing and exporting form submissions.
 *
 * All routes require the ADMIN role. The EDITOR role deliberately does not
 * have access to raw submission data (including IP addresses).
 */
@RestController
@RequestMapping("/api/v1/admin/forms")
@PreAuthorize("hasRole('ADMIN')")
public class FormSubmissionAdminController {

    private final FormSubmissionRepository formSubmissionRepository;

    public FormSubmissionAdminController(FormSubmissionRepository formSubmissionRepository) {
        this.formSubmissionRepository = formSubmissionRepository;
    }

    /**
     * Paginated list of submissions, optionally filtered by form type.
     *
     * GET /api/v1/admin/forms?page=0&size=25&formType=CONTACT
     */
    @GetMapping
    public Page<FormSubmissionAdminResponse> list(
            @RequestParam(required = false) FormType formType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<FormSubmission> submissions = (formType != null)
                ? formSubmissionRepository.findByFormType(formType, pageable)
                : formSubmissionRepository.findAll(pageable);

        return submissions.map(this::toAdminResponse);
    }

    /**
     * CSV export of all submissions (or filtered by type).
     * Returns a downloadable file with RFC 4180-compliant quoting.
     *
     * GET /api/v1/admin/forms/export.csv?formType=CONTACT
     */
    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) FormType formType
    ) {
        List<FormSubmission> submissions = (formType != null)
                ? formSubmissionRepository.findByFormTypeOrderByCreatedAtDesc(formType)
                : formSubmissionRepository.findAllByOrderByCreatedAtDesc();

        StringBuilder csv = new StringBuilder(FormSubmissionAdminResponse.csvHeader()).append("\n");
        for (FormSubmission s : submissions) {
            csv.append(toAdminResponse(s).toCsvRow()).append("\n");
        }

        String filename = formType != null
                ? "submissions-" + formType.name().toLowerCase() + ".csv"
                : "submissions-all.csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(csv.toString());
    }

    private FormSubmissionAdminResponse toAdminResponse(FormSubmission s) {
        return new FormSubmissionAdminResponse(
                s.getId(),
                s.getCreatedAt(),
                s.getFormType() != null ? s.getFormType().name() : null,
                s.getFullName(),
                s.getEmail(),
                s.getCompany(),
                s.getDepartment(),
                s.getJobTitle(),
                s.getPhone(),
                s.getMessage(),
                s.isConsentAccepted(),
                s.getSourcePage(),
                s.getIpAddress()
        );
    }
}
