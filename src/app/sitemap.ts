import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the two homepages: the legal pages are noindex and stay out of the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = { languages: { en: SITE_URL, de: `${SITE_URL}/de` } };
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1, alternates },
    { url: `${SITE_URL}/de`, changeFrequency: "monthly", priority: 1, alternates },
  ];
}
