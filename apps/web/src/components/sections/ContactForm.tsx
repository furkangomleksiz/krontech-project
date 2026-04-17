"use client";

import { useState } from "react";
import type { Locale } from "@/types/content";

interface ContactFormProps {
  locale: Locale;
}

export function ContactForm({ locale }: ContactFormProps) {
  const [fields, setFields] = useState({
    firstName: "", lastName: "", email: "", jobTitle: "",
    department: "", company: "", phone: "", subject: "", message: "",
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus("sending");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/forms/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "CONTACT",
          fullName: `${fields.firstName} ${fields.lastName}`.trim(),
          email: fields.email,
          company: fields.company,
          jobTitle: fields.jobTitle,
          phone: fields.phone,
          message: fields.message || fields.subject || "Contact request",
          consentAccepted: true,
          sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const t = locale === "tr"
    ? { title: "İletişim Formu", req: "*", send: "Gönder", sending: "Gönderiliyor…", sent: "Mesajınız iletildi, en kısa sürede size döneceğiz!", error: "Bir hata oluştu, lütfen tekrar deneyin.", consent: "Kişisel verilerimin üçüncü taraflara aktarılmasına Gizlilik Politikası kapsamında onay veriyorum." }
    : { title: "Contact Us", req: "*", send: "Send", sending: "Sending…", sent: "Your message was received. We'll get back to you shortly!", error: "Something went wrong. Please try again.", consent: "I consent to the transfer of my personal data to third parties in Turkey and abroad within the scope of the Privacy Policy." };

  if (status === "sent") {
    return (
      <div className="contact-page-form">
        <p className="form-status form-status--success">{t.sent}</p>
      </div>
    );
  }

  return (
    <form className="contact-page-form" onSubmit={handleSubmit} noValidate>
      <h1 className="contact-page-form__title">{t.title}</h1>

      <div className="form-grid-2">
        <div className="form-field">
          <label htmlFor="firstName">First Name {t.req}</label>
          <input id="firstName" name="firstName" value={fields.firstName} onChange={handleChange} required autoComplete="given-name" />
        </div>
        <div className="form-field">
          <label htmlFor="lastName">Last Name {t.req}</label>
          <input id="lastName" name="lastName" value={fields.lastName} onChange={handleChange} required autoComplete="family-name" />
        </div>
        <div className="form-field">
          <label htmlFor="email">E-Mail {t.req}</label>
          <input id="email" name="email" type="email" value={fields.email} onChange={handleChange} required autoComplete="email" />
        </div>
        <div className="form-field">
          <label htmlFor="jobTitle">Job Title</label>
          <input id="jobTitle" name="jobTitle" value={fields.jobTitle} onChange={handleChange} autoComplete="organization-title" />
        </div>
        <div className="form-field">
          <label htmlFor="department">Department</label>
          <select id="department" name="department" value={fields.department} onChange={handleChange}>
            <option value="">— Select —</option>
            <option>IT &amp; Security</option>
            <option>Operations</option>
            <option>Management</option>
            <option>Finance</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="company">Company {t.req}</label>
          <input id="company" name="company" value={fields.company} onChange={handleChange} required autoComplete="organization" />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" value={fields.phone} onChange={handleChange} autoComplete="tel" />
        </div>
        <div className="form-field">
          <label htmlFor="subject">Subject</label>
          <select id="subject" name="subject" value={fields.subject} onChange={handleChange}>
            <option value="">— Select —</option>
            <option>Product Information</option>
            <option>Request a Demo</option>
            <option>Technical Support</option>
            <option>Partnership</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-field form-full">
          <label htmlFor="message">Message {t.req}</label>
          <textarea id="message" name="message" value={fields.message} onChange={handleChange} required rows={4} />
        </div>
      </div>

      <label className="form-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>{t.consent}</span>
      </label>

      {status === "error" && (
        <p className="form-status form-status--error">{t.error}</p>
      )}

      <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
        {status === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}
