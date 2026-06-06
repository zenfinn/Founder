"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardBento } from "@/components/dashboard/DashboardBento";
import { useDashboardData } from "@/components/dashboard/useDashboardData";

export function DashboardClient() {
  const data = useDashboardData();

  return (
    <AuthGuard>
      <DashboardBento {...data} />
    </AuthGuard>
  );
}
