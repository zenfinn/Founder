import { Suspense } from "react";
import "./globals.css";
import { inter } from "@/app/fonts";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { PwaInstaller } from "@/components/PwaInstaller";
import { getPageMetadata, OG_IMAGE_URL, PAGE_SEO, SITE_NAME, getBaseUrl } from "@/lib/seo";

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
    icon: [
      { url: "/founder-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
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
        <GoogleAnalytics />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
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
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Founder – Die verifizierte Community für deutsche Unternehmer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
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
