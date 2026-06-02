"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardBento } from "@/components/dashboard/DashboardBento";
import { DashboardClassic } from "@/components/dashboard/DashboardClassic";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { resolveDashboardVariant, writeDashboardVariant } from "@/lib/dashboard-variant";

export function DashboardClient({ initialVariant }) {
  const [variant, setVariant] = useState("bento");
  const data = useDashboardData();

  useEffect(() => {
    const resolved = resolveDashboardVariant(initialVariant);
    if (initialVariant === "classic" || initialVariant === "bento") {
      writeDashboardVariant(resolved);
    }
    setVariant(resolved);
  }, [initialVariant]);

  const sharedProps = {
    ...data,
    onSwitchClassic: () => setVariant("classic"),
    onSwitchBento: () => setVariant("bento"),
  };

  return (
    <AuthGuard>
      {variant === "classic" ? <DashboardClassic {...sharedProps} /> : <DashboardBento {...sharedProps} />}
    </AuthGuard>
  );
}
