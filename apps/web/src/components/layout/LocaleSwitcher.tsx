"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/types/content";

interface LocaleSwitcherProps {
  locale: Locale;
}

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const otherLocale: Locale = locale === "tr" ? "en" : "tr";
  const pathname = usePathname() ?? `/${locale}`;
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchLocale() {
    setPending(true);
    try {
      const q = new URLSearchParams({ from: pathname, to: otherLocale });
      const res = await fetch(`/api/nav/locale-target?${q.toString()}`);
      const data = (await res.json()) as { href?: string };
      const href = typeof data.href === "string" ? data.href : `/${otherLocale}`;
      router.push(href);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="locale-btn"
      aria-label={`Switch to ${otherLocale.toUpperCase()}`}
      aria-busy={pending}
      disabled={pending}
      onClick={() => {
        void switchLocale();
      }}
    >
      {locale.toUpperCase()}
      <svg className="nav-chevron" viewBox="0 0 10 10" aria-hidden="true">
        <polyline points="2,3 5,7 8,3" />
      </svg>
    </button>
  );
}
