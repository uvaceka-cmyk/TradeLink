import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zakly.cz";
  const now = new Date();
  const pages = ["", "/prace", "/zakazky", "/dodavatele", "/dodavatele/seznam", "/registrace", "/pro-uchazece", "/pro-dodavatele", "/pro-zamestnavatele", "/o-nas", "/kontakt", "/podminky", "/ochrana-osobnich-udaju", "/cookies"];
  return pages.map((path, index) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: (index < 5 ? "daily" : "monthly") as "daily" | "monthly",
    priority: index === 0 ? 1 : index < 5 ? 0.9 : 0.5,
  }));
}
