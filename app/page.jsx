import { WaitlistPage } from "@/components/waitlist/WaitlistPage";

export const metadata = {
  title: "Founder – Waitlist | Early Access für verifizierte Gründer",
  description:
    "Trag dich in die Founder Waitlist ein. Limitierte Plätze für Deutschlands verifizierte Gründer-Community.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <WaitlistPage />;
}
