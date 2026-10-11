import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { cv } from "@/content/cv";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });
const mono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "700"] });

const title = "Fabian Riegsinger — Automotive Engineer → Agentic Builder";
const description = cv.profile.summary.split(". ")[0] + ".";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { title, description, type: "profile", url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

// No email or phone: structured data is public and scraped.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: cv.profile.name,
  jobTitle: cv.profile.headline,
  address: { "@type": "PostalAddress", addressLocality: "Ingolstadt", addressCountry: "DE" },
  url: SITE_URL,
  sameAs: [cv.profile.links.github, cv.profile.links.linkedin, cv.profile.links.xing],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
