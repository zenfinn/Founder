import { AuthLanding } from "@/components/auth/AuthLanding";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("login");

export default function LoginPage() {
  return <AuthLanding highlight="login" />;
}
