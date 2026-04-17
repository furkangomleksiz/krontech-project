"use client";

import { useState } from "react";
import type { Locale } from "@/types/content";
import { submitForm } from "@/lib/api/forms";

interface ContactBandProps {
  locale: Locale;
}

type BandFields = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  website: string; // honeypot
};

export function ContactBand({ locale }: ContactBandProps) {
  const [fields, setFields] = useState<BandFields>({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    website: "", // honeypot — always stays empty for real users
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    // Client-side validation (compact: single error message for the band form)
    if (!fields.firstName.trim() || !fields.lastName.trim() || !fields.company.trim()) {
      setErrorMsg(
        locale === "tr"
          ? "Ad, soyad ve şirket alanları zorunludur."
          : "First name, last name, and company are required."
      );
      return;
    }
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      setErrorMsg(
        locale === "tr"
          ? "Geçerli bir e-posta adresi girin."
          : "Enter a valid email address."
      );
      return;
    }
    if (!consent) {
      setErrorMsg(
        locale === "tr"
          ? "Devam etmek için gizlilik politikasını kabul etmelisiniz."
          : "You must accept the privacy policy to continue."
      );
      return;
    }

    setStatus("sending");
    const result = await submitForm({
      formType: "CONTACT",
      fullName: `${fields.firstName} ${fields.lastName}`.trim(),
      email: fields.email.trim(),
      company: fields.company.trim(),
      phone: fields.phone || undefined,
      message: "Contact request from website footer form.",
      consentAccepted: true,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
      website: fields.website, // honeypot
    });

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMsg(result.message);
    }
  }

  const t =
    locale === "tr"
      ? {
          title: "İletişime Geçin",
          sub: "Krontech teknoloji ürünleri ve hizmetleri hakkında daha fazla bilgi almak için bize ulaşın.",
          link: "Ürünlerimiz →",
          firstName: "Ad",
          lastName: "Soyad",
          company: "Şirket",
          email: "E-posta",
          phone: "Telefon",
          consent:
            "Kişisel verilerimin işlenmesine onay veriyorum.",
          send: "Gönder",
          sent: "Mesajınız alındı, teşekkürler!",
        }
      : {
          title: "Contact Us",
          sub: "Contact us to learn more about Kron Technologies' products and services.",
          link: "Our Products →",
          firstName: "First Name",
          lastName: "Last Name",
          company: "Company",
          email: "Email",
          phone: "Phone",
          consent:
            "I consent to the transfer of my personal data to third parties in Turkey and abroad within the scope of the Privacy Policy.",
          send: "Send",
          sent: "Message received, thank you!",
        };

  return (
    <section className="contact-band" aria-label="Contact us">
      <div className="contact-band__inner">
        {/* Left copy */}
        <div className="contact-band__text">
          <h2 className="contact-band__title">{t.title}</h2>
          <p className="contact-band__sub">{t.sub}</p>
          <a href={`/${locale}/products/kron-pam`} className="contact-band__link">
            {t.link}
          </a>
        </div>

        {/* Right form */}
        <form className="band-form" onSubmit={handleSubmit} noValidate>
          {/* Honeypot */}
          <input
            name="website"
            value={fields.website}
            onChange={handleChange}
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
          />

          <div className="band-form__row">
            <div className="band-form__field">
              <input
                name="firstName"
                placeholder={t.firstName}
                value={fields.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                aria-label={t.firstName}
              />
            </div>
            <div className="band-form__field">
              <input
                name="lastName"
                placeholder={t.lastName}
                value={fields.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                aria-label={t.lastName}
              />
            </div>
          </div>

          <div className="band-form__row">
            <div className="band-form__field">
              <input
                name="company"
                placeholder={t.company}
                value={fields.company}
                onChange={handleChange}
                autoComplete="organization"
                aria-label={t.company}
              />
            </div>
            <div className="band-form__field">
              <input
                name="email"
                type="email"
                placeholder={t.email}
                value={fields.email}
                onChange={handleChange}
                autoComplete="email"
                aria-label={t.email}
              />
            </div>
          </div>

          <div className="band-form__field">
            <input
              name="phone"
              type="tel"
              placeholder={t.phone}
              value={fields.phone}
              onChange={handleChange}
              autoComplete="tel"
              aria-label={t.phone}
            />
          </div>

          <label className="band-form__consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errorMsg) setErrorMsg("");
              }}
              aria-label={t.consent}
            />
            <span>{t.consent}</span>
          </label>

          {/* Single error message for compact form layout */}
          {errorMsg && (
            <p className="form-status form-status--error band-form__status" role="alert">
              {errorMsg}
            </p>
          )}

          {status === "sent" ? (
            <p className="form-status form-status--success band-form__status" role="status">
              {t.sent}
            </p>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={status === "sending"}
            >
              {status === "sending" ? "…" : t.send}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
