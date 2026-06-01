import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { buildBreadcrumbSchema } from "@/lib/seo";

export function Breadcrumbs({ items }) {
  if (!items?.length) return null;

  const schemaItems = [{ name: "Start", href: "/" }, ...items];

  return (
    <>
      <SEO jsonLd={buildBreadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-500">
        <Link href="/" className="transition hover:text-founder-600">
          Start
        </Link>
        {items.map((item, index) => (
          <span key={`${item.name}-${index}`} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="transition hover:text-founder-600">
                {item.name}
              </Link>
            ) : (
              <span className="text-slate-800">{item.name}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
