export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/raenge",
    "/raenge/aspiring",
    "/raenge/starter",
    "/raenge/builder",
    "/raenge/scaler",
    "/raenge/elite",
    "/community",
    "/events",
    "/mentoren",
    "/login",
    "/register",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/kontakt",
    "/profile/edit",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
