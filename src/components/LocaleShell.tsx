import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { preload } from "react-dom";
import type { ReactNode } from "react";
import { cv } from "@/content/cv";
import type { Locale } from "@/lib/locale";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import { ReducedMotionNotice } from "./ReducedMotionNotice";
import { SiteControls } from "./SiteControls";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

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

/** The document every locale shares: html/body, fonts, theme, structured data, controls and analytics. */
export function LocaleShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  // Start the hero likeness download with the HTML, not after the 3D code has loaded (same request useGLTF makes).
  preload("/models/me.glb", { as: "fetch", crossOrigin: "anonymous" });
  // Its Draco decoder too, which DRACOLoader would otherwise only request once the 3D code has run.
  preload("/draco/draco_wasm_wrapper.js", { as: "fetch", crossOrigin: "anonymous" });
  preload("/draco/draco_decoder.wasm", { as: "fetch", crossOrigin: "anonymous" });
  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        {children}
        <SiteControls />
        <ReducedMotionNotice />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
