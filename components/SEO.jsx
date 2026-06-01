/**
 * Rendert JSON-LD strukturierte Daten. Meta-Tags werden über export const metadata / generateMetadata gesetzt.
 */
export function SEO({ jsonLd }) {
  if (!jsonLd) return null;

  const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={item["@type"] ? `${item["@type"]}-${index}` : index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
