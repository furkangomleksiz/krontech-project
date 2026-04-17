import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/sections/ContactForm";
import { OfficeCard } from "@/components/sections/OfficeCard";
import { PageHero } from "@/components/sections/PageHero";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicPage } from "@/lib/api/public-content";
import { mockOffices } from "@/lib/api/mock-content";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/types/content";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const page = await getPublicPage(locale as Locale, "contact");
  return buildMetadata(page.seo, locale as Locale);
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const l = locale as Locale;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: `/${l}` },
          { label: "Contact" },
        ])}
      />
      {/* Short hero image strip */}
      <PageHero
        title=""
        subtitle=""
        breadcrumbs={[
          { label: "Home", href: `/${l}` },
          { label: "Contact" },
        ]}
      />

      {/* Breadcrumb + Form */}
      <section className="section-pad bg-gray" aria-label="Contact form">
        <div className="container" style={{ maxWidth: 880 }}>
          <Breadcrumb
            items={[
              { label: "Home", href: `/${l}` },
              { label: "Contact" },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <ContactForm locale={l} />
          </div>
        </div>
      </section>

      {/* Office locations */}
      <section className="office-section section-pad" aria-label="Office locations">
        <div className="container">
          {mockOffices.map((office) => (
            <OfficeCard key={office.id} office={office} />
          ))}
        </div>
      </section>
    </>
  );
}
