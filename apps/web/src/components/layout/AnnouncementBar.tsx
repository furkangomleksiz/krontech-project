import Link from "next/link";
import type { Locale } from "@/types/content";

interface AnnouncementBarProps {
  locale: Locale;
}

export function AnnouncementBar({ locale }: AnnouncementBarProps) {
  const registerHref = `/${locale}/contact`;
  return (
    <div className="announce-bar" role="banner" aria-label="Site announcement">
      <p className="announce-bar__text">
        <span>[14 Apr] Webinar with KuppingerCole, Kron &amp; Turkish:</span>{" "}
        Rethinking Privileged Access for Non-Human Identity
      </p>
      <Link href={registerHref} className="announce-bar__cta">
        Register Now
      </Link>
    </div>
  );
}
