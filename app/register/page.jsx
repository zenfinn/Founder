import { AuthLanding } from "@/components/auth/AuthLanding";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("register");

export default function RegisterPage({ searchParams }) {
  const requestedRank = searchParams?.rank ?? searchParams?.rang ?? "aspiring";
  const referralCode = searchParams?.ref ?? "";
  const intent = searchParams?.intent ?? "";

  return (
    <AuthLanding
      highlight="register"
      requestedRank={requestedRank}
      referralCode={referralCode}
      intent={intent}
    />
  );
}
