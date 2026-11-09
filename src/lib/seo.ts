import type { Metadata } from "next";
import type { CV } from "@/content/types";
import type { Locale } from "./locale";

/**
 * Explicit crawl directives for the two homepages (the legal pages override this with noindex). Besides index/follow,
 * they let Google show full-length snippets and large image previews, which it otherwise limits.
 */
export const ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

/**
 * Google Search Console ownership tag, from the GOOGLE_SITE_VERIFICATION env var (the `content` of the
 * `google-site-verification` meta tag Search Console shows). Absent when the variable is not set.
 */
export function verification(env: Record<string, string | undefined> = process.env): Metadata["verification"] {
  const google = env.GOOGLE_SITE_VERIFICATION?.trim();
  return google ? { google } : undefined;
}

const personOf = (cv: CV, siteUrl: string) => ({
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: cv.profile.name,
  jobTitle: cv.profile.headline,
  url: siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Ingolstadt", addressCountry: "DE" },
  sameAs: [cv.profile.links.github, cv.profile.links.linkedin, cv.profile.links.xing],
});

/**
 * schema.org data for every page: the website and the person behind it. No email or phone: structured data is public
 * and scraped.
 */
export function siteStructuredData(cv: CV, siteUrl: string) {
  const person = personOf(cv, siteUrl);
  const website = { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: cv.profile.name, inLanguage: ["en", "de"], publisher: { "@id": person["@id"] } };
  return { "@context": "https://schema.org", "@graph": [website, person] as [typeof website, typeof person] };
}

/**
 * schema.org ProfilePage for a homepage only (Google reads it for person results): this language's page, with the
 * person it is about spelled out in full, since a reference to the other script block on the page may not be followed.
 */
export function profilePageStructuredData(cv: CV, locale: Locale, siteUrl: string) {
  const page = locale === "de" ? `${siteUrl}/de` : siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${page}#profile`,
    url: page,
    name: `${cv.profile.name} — ${cv.profile.headline}`,
    description: cv.profile.summary.split(". ")[0] + ".",
    inLanguage: locale,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: personOf(cv, siteUrl),
  };
}
