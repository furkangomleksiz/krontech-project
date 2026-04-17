"use client";

import { useState } from "react";
import type { Locale } from "@/types/content";

interface ContactBandProps {
  locale: Locale;
}

export function ContactBand({ locale }: ContactBandProps) {
  const [fields, setFields] = useState({ firstName: "", lastName: "", company: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
          phone: fields.phone,
          message: "Contact request from website footer form.",
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
    ? { title: "İletişime Geçin", sub: "Krontech teknoloji ürünleri ve hizmetleri hakkında daha fazla bilgi almak için bize ulaşın.", link: "Ürünlerimiz →", firstName: "Ad", lastName: "Soyad", company: "Şirket", email: "E-posta", phone: "Telefon", consent: "Kişisel verilerimin işlenmesine onay veriyorum.", send: "Gönder", sent: "Mesajınız alındı, teşekkürler!", error: "Bir hata oluştu. Lütfen tekrar deneyin." }
    : { title: "Contact Us", sub: "Contact us to learn more about Kron Technologies' telecoms and products.", link: "Our Products →", firstName: "First Name", lastName: "Last Name", company: "Company", email: "Email", phone: "Phone", consent: "I consent to the transfer of my personal data to third parties in Turkey and abroad within the scope of the Privacy Policy.", send: "Send", sent: "Message received, thank you!", error: "Something went wrong. Please try again." };

  return (
    <section className="contact-band" aria-label="Contact us">
      <div className="contact-band__inner">
        {/* Left copy */}
        <div className="contact-band__text">
          <h2 className="contact-band__title">{t.title}</h2>
          <p className="contact-band__sub">{t.sub}</p>
          <a href={`/${locale}/products/kron-pam`} className="contact-band__link">{t.link}</a>
        </div>

        {/* Right form */}
        <form className="band-form" onSubmit={handleSubmit} noValidate>
          <div className="band-form__row">
            <div className="band-form__field">
              <input name="firstName" placeholder={t.firstName} value={fields.firstName} onChange={handleChange} required autoComplete="given-name" aria-label={t.firstName} />
            </div>
            <div className="band-form__field">
              <input name="lastName" placeholder={t.lastName} value={fields.lastName} onChange={handleChange} required autoComplete="family-name" aria-label={t.lastName} />
            </div>
          </div>
          <div className="band-form__row">
            <div className="band-form__field">
              <input name="company" placeholder={t.company} value={fields.company} onChange={handleChange} required autoComplete="organization" aria-label={t.company} />
            </div>
            <div className="band-form__field">
              <input name="email" type="email" placeholder={t.email} value={fields.email} onChange={handleChange} required autoComplete="email" aria-label={t.email} />
            </div>
          </div>
          <div className="band-form__field">
            <input name="phone" type="tel" placeholder={t.phone} value={fields.phone} onChange={handleChange} autoComplete="tel" aria-label={t.phone} />
          </div>
          <label className="band-form__consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-label={t.consent} />
            <span>{t.consent}</span>
          </label>
          {status === "idle" || status === "sending" ? (
            <button type="submit" className="btn btn-primary btn-sm" disabled={status === "sending"}>
              {status === "sending" ? "…" : t.send}
            </button>
          ) : (
            <p className={`form-status ${status === "sent" ? "form-status--success" : "form-status--error"}`}>
              {status === "sent" ? t.sent : t.error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
