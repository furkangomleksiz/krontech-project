"use client";

import { useState } from "react";
import type { Locale } from "@/types/content";
import { submitForm } from "@/lib/api/forms";

interface ContactFormProps {
  locale: Locale;
}

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
  website: string; // honeypot — always empty for real users
};

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "company" | "message" | "consent", string>
>;

function validate(fields: Fields, consent: boolean): FieldErrors {
  const e: FieldErrors = {};

  if (!fields.firstName.trim()) {
    e.firstName = "First name is required.";
  } else if (fields.firstName.trim().length < 2) {
    e.firstName = "Must be at least 2 characters.";
  }

  if (!fields.lastName.trim()) {
    e.lastName = "Last name is required.";
  } else if (fields.lastName.trim().length < 2) {
    e.lastName = "Must be at least 2 characters.";
  }

  if (!fields.email.trim()) {
    e.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    e.email = "Enter a valid email address.";
  }

  if (!fields.company.trim()) {
    e.company = "Company name is required.";
  }

  if (!fields.message.trim()) {
    e.message = "Message is required.";
  } else if (fields.message.trim().length < 10) {
    e.message = "Message must be at least 10 characters.";
  }

  if (!consent) {
    e.consent = "You must accept the privacy policy to continue.";
  }

  return e;
}

export function ContactForm({ locale }: ContactFormProps) {
  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    department: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    website: "", // honeypot
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [apiError, setApiError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear per-field error as the user corrects it (after first submit attempt)
    if (attempted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FieldErrors];
        return next;
      });
    }
  }

  function handleConsentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setConsent(e.target.checked);
    if (attempted && e.target.checked) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.consent;
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setApiError("");

    const validationErrors = validate(fields, consent);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStatus("sending");

    const result = await submitForm({
      formType: "CONTACT",
      fullName: `${fields.firstName} ${fields.lastName}`.trim(),
      email: fields.email.trim(),
      company: fields.company.trim(),
      department: fields.department || undefined,
      phone: fields.phone || undefined,
      jobTitle: fields.jobTitle || undefined,
      message: fields.message.trim() || fields.subject || "Contact request",
      consentAccepted: true,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
      website: fields.website, // honeypot
    });

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setApiError(result.message);
    }
  }

  const t =
    locale === "tr"
      ? {
          title: "İletişim Formu",
          req: "*",
          send: "Gönder",
          sending: "Gönderiliyor…",
          sent: "Mesajınız iletildi, en kısa sürede size döneceğiz!",
          consent:
            "Kişisel verilerimin üçüncü taraflara aktarılmasına Gizlilik Politikası kapsamında onay veriyorum.",
        }
      : {
          title: "Contact Us",
          req: "*",
          send: "Send",
          sending: "Sending…",
          sent: "Your message was received. We'll get back to you shortly!",
          consent:
            "I consent to the transfer of my personal data to third parties in Turkey and abroad within the scope of the Privacy Policy.",
        };

  if (status === "sent") {
    return (
      <div className="contact-page-form">
        <p className="form-status form-status--success" role="status">
          {t.sent}
        </p>
      </div>
    );
  }

  return (
    <form className="contact-page-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from real users, visible to bots */}
      <input
        name="website"
        value={fields.website}
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
      />

      <h1 className="contact-page-form__title">{t.title}</h1>

      <div className="form-grid-2">
        {/* First Name */}
        <div className={`form-field${errors.firstName ? " form-field--error" : ""}`}>
          <label htmlFor="cf-firstName">
            First Name <span aria-hidden="true">{t.req}</span>
          </label>
          <input
            id="cf-firstName"
            name="firstName"
            value={fields.firstName}
            onChange={handleChange}
            autoComplete="given-name"
            aria-required="true"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? "cf-err-firstName" : undefined}
          />
          {errors.firstName && (
            <span id="cf-err-firstName" className="form-field__error" role="alert">
              {errors.firstName}
            </span>
          )}
        </div>

        {/* Last Name */}
        <div className={`form-field${errors.lastName ? " form-field--error" : ""}`}>
          <label htmlFor="cf-lastName">
            Last Name <span aria-hidden="true">{t.req}</span>
          </label>
          <input
            id="cf-lastName"
            name="lastName"
            value={fields.lastName}
            onChange={handleChange}
            autoComplete="family-name"
            aria-required="true"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? "cf-err-lastName" : undefined}
          />
          {errors.lastName && (
            <span id="cf-err-lastName" className="form-field__error" role="alert">
              {errors.lastName}
            </span>
          )}
        </div>

        {/* Email */}
        <div className={`form-field${errors.email ? " form-field--error" : ""}`}>
          <label htmlFor="cf-email">
            E-Mail <span aria-hidden="true">{t.req}</span>
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-err-email" : undefined}
          />
          {errors.email && (
            <span id="cf-err-email" className="form-field__error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Job Title */}
        <div className="form-field">
          <label htmlFor="cf-jobTitle">Job Title</label>
          <input
            id="cf-jobTitle"
            name="jobTitle"
            value={fields.jobTitle}
            onChange={handleChange}
            autoComplete="organization-title"
          />
        </div>

        {/* Department */}
        <div className="form-field">
          <label htmlFor="cf-department">Department</label>
          <select
            id="cf-department"
            name="department"
            value={fields.department}
            onChange={handleChange}
          >
            <option value="">— Select —</option>
            <option>IT &amp; Security</option>
            <option>Operations</option>
            <option>Management</option>
            <option>Finance</option>
            <option>Other</option>
          </select>
        </div>

        {/* Company */}
        <div className={`form-field${errors.company ? " form-field--error" : ""}`}>
          <label htmlFor="cf-company">
            Company <span aria-hidden="true">{t.req}</span>
          </label>
          <input
            id="cf-company"
            name="company"
            value={fields.company}
            onChange={handleChange}
            autoComplete="organization"
            aria-required="true"
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "cf-err-company" : undefined}
          />
          {errors.company && (
            <span id="cf-err-company" className="form-field__error" role="alert">
              {errors.company}
            </span>
          )}
        </div>

        {/* Phone */}
        <div className="form-field">
          <label htmlFor="cf-phone">Phone</label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            value={fields.phone}
            onChange={handleChange}
            autoComplete="tel"
          />
        </div>

        {/* Subject */}
        <div className="form-field">
          <label htmlFor="cf-subject">Subject</label>
          <select id="cf-subject" name="subject" value={fields.subject} onChange={handleChange}>
            <option value="">— Select —</option>
            <option>Product Information</option>
            <option>Request a Demo</option>
            <option>Technical Support</option>
            <option>Partnership</option>
            <option>Other</option>
          </select>
        </div>

        {/* Message */}
        <div
          className={`form-field form-full${errors.message ? " form-field--error" : ""}`}
        >
          <label htmlFor="cf-message">
            Message <span aria-hidden="true">{t.req}</span>
          </label>
          <textarea
            id="cf-message"
            name="message"
            value={fields.message}
            onChange={handleChange}
            rows={4}
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "cf-err-message" : undefined}
          />
          {errors.message && (
            <span id="cf-err-message" className="form-field__error" role="alert">
              {errors.message}
            </span>
          )}
        </div>
      </div>

      {/* Consent */}
      <div className={`form-consent-wrapper${errors.consent ? " form-consent-wrapper--error" : ""}`}>
        <label className="form-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={handleConsentChange}
            aria-required="true"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "cf-err-consent" : undefined}
          />
          <span>{t.consent}</span>
        </label>
        {errors.consent && (
          <span id="cf-err-consent" className="form-field__error" role="alert">
            {errors.consent}
          </span>
        )}
      </div>

      {/* API-level error */}
      {apiError && (
        <p className="form-status form-status--error" role="alert">
          {apiError}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === "sending"}
      >
        {status === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}
