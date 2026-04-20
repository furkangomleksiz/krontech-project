/**
 * Typed API client for form submission.
 *
 * Both ContactForm and ContactBand use this module so the fetch URL,
 * request shape, and error handling are defined exactly once.
 */

import { getApiBaseUrl } from "./base-url";

function resolveApiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const base = getApiBaseUrl();
  const origin = base.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
  return origin || "http://localhost:8080";
}

export interface FormPayload {
  formType: "CONTACT" | "DEMO_REQUEST";
  /** Combined first + last name */
  fullName: string;
  email: string;
  company: string;
  /** Optional — selected from department dropdown */
  department?: string;
  phone?: string;
  jobTitle?: string;
  /** Required: min 10 chars */
  message: string;
  consentAccepted: boolean;
  /** URL path of the page the form was on (for attribution) */
  sourcePage: string;
  /**
   * Honeypot field.
   * Always send as an empty string from frontend code.
   * Any non-blank value server-side signals automated submission.
   */
  website: string;
}

export interface FormSuccessResult {
  ok: true;
  submissionId: string;
}

export interface FormErrorResult {
  ok: false;
  /** HTTP status code, or 0 for network failure */
  httpStatus: number;
  /** Human-readable message from the API's ApiError response, or a generic fallback */
  message: string;
}

export type FormResult = FormSuccessResult | FormErrorResult;

export async function submitForm(payload: FormPayload): Promise<FormResult> {
  try {
    const res = await fetch(`${resolveApiOrigin()}/api/v1/forms/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const body = (await res.json()) as { submissionId: string };
      return { ok: true, submissionId: body.submissionId };
    }

    // Parse the structured ApiError response body
    let message = "Something went wrong. Please try again.";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore JSON parse failures for error bodies */
    }

    // Override generic message for well-known status codes
    if (res.status === 429) {
      message = "Too many submissions. Please wait before trying again.";
    }

    return { ok: false, httpStatus: res.status, message };
  } catch {
    return {
      ok: false,
      httpStatus: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}
