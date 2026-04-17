/**
 * Injects one or more JSON-LD schema.org scripts into the document head.
 * This is a server component — no client bundle cost.
 *
 * Usage:
 *   <JsonLd data={articleSchema(post, url)} />
 *   <JsonLd data={[organizationSchema(), websiteSchema(locale)]} />
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
