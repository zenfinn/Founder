"use client";

import { useCallback, useState } from "react";
import { getDashboardCopy } from "@/components/dashboard/dashboard-i18n";

export function useDashboardLocale(initialLocale = "de") {
  const [locale, setLocale] = useState(initialLocale);
  const copy = getDashboardCopy(locale);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "de" ? "en" : "de"));
  }, []);

  return { locale, setLocale, toggleLocale, copy };
}
