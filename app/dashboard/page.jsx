import { DashboardClient } from "@/components/DashboardClient";
import { ReferralCapture } from "@/components/ReferralCapture";

export const metadata = {
  title: "Dashboard",
  description: "Dein Founder Dashboard mit Gruppen, Events, Mentoren und Verifikationsstatus.",
};

export default function DashboardPage({ searchParams }) {
  return (
    <>
      <ReferralCapture referralCode={searchParams?.ref} />
      <DashboardClient />
    </>
  );
}
