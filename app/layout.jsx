import { Suspense } from "react";
import "./globals.css";
import { inter } from "@/app/fonts";
import { Analytics } from "@/components/Analytics";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { PwaInstaller } from "@/components/PwaInstaller";
import { buildOgImageUrl, getPageMetadata, PAGE_SEO, SITE_NAME, SITE_TAGLINE, getBaseUrl } from "@/lib/seo";

const homeMeta = getPageMetadata("home");

export const metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: PAGE_SEO.home.title,
    template: "%s",
  },
  description: homeMeta.description,
  keywords: homeMeta.keywords,
  alternates: homeMeta.alternates,
  openGraph: homeMeta.openGraph,
  twitter: homeMeta.twitter,
  robots: homeMeta.robots,
  manifest: "/manifest.json",
  icons: {
    icon: "/founder-icon.svg",
    apple: "/founder-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  other: {
    "linkedin:owner": SITE_NAME,
  },
};

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export const viewport = {
  themeColor: "#1a3aad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {supabaseHost && (
          <>
            <link rel="preconnect" href={supabaseHost} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseHost} />
          </>
        )}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <meta property="og:image" content={buildOgImageUrl({ title: SITE_NAME, subtitle: SITE_TAGLINE })} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <ConditionalFooter />
        </div>
        <PwaInstaller />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
