"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

const HIDE_FOOTER_PREFIXES = ["/link", "/share/"];

export function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter =
    pathname === "/" || HIDE_FOOTER_PREFIXES.some((prefix) => pathname === prefix || pathname?.startsWith(prefix));

  if (hideFooter) return null;
  return <Footer />;
}
