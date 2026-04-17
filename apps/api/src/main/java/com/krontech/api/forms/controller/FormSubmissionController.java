package com.krontech.api.forms.controller;

import com.krontech.api.forms.dto.FormSubmissionRequest;
import com.krontech.api.forms.dto.FormSubmissionResponse;
import com.krontech.api.forms.service.FormSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/forms")
public class FormSubmissionController {

    private final FormSubmissionService formSubmissionService;

    public FormSubmissionController(FormSubmissionService formSubmissionService) {
        this.formSubmissionService = formSubmissionService;
    }

    @PostMapping("/submit")
    @ResponseStatus(HttpStatus.CREATED)
    public FormSubmissionResponse submit(
            @Valid @RequestBody FormSubmissionRequest request,
            HttpServletRequest httpRequest
    ) {
        return formSubmissionService.save(request, httpRequest);
    }
}
