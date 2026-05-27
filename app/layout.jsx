import "./globals.css";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { PwaInstaller } from "@/components/PwaInstaller";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Founder",
    template: "%s | Founder",
  },
  description: "Die verifizierte Community für Gründer und Unternehmer in Deutschland.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Founder",
    description: "Die verifizierte Community für echte Unternehmer in Deutschland.",
    url: "/",
    siteName: "Founder",
    images: [
      {
        url: "/founder-icon.svg",
        width: 512,
        height: 512,
        alt: "Founder",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Founder",
    description: "Die verifizierte Community für echte Unternehmer in Deutschland.",
    images: ["/founder-icon.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Founder",
  },
  icons: {
    icon: "/founder-icon.svg",
    apple: "/founder-icon.svg",
  },
};

export const viewport = {
  themeColor: "#1a3aad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <ConditionalFooter />
        </div>
        <PwaInstaller />
      </body>
    </html>
  );
}
