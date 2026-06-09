"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardHub } from "@/components/dashboard/DashboardHub";
import { useDashboardData } from "@/components/dashboard/useDashboardData";

export function DashboardClient() {
  const data = useDashboardData();

  return (
    <AuthGuard>
      <DashboardHub {...data} />
    </AuthGuard>
  );
}
