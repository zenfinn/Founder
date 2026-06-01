import { getBaseUrl } from "@/lib/seo";

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/profile/edit",
          "/profile/verify",
          "/inbox",
          "/members/",
          "/notifications",
          "/affiliate",
          "/payment/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
