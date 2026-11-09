import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { preload } from "react-dom";
import type { ReactNode } from "react";
import { cvDe } from "@/content/cv.de";
import { cvEn } from "@/content/cv.en";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/locale";
import { siteStructuredData } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import { ReducedMotionNotice } from "./ReducedMotionNotice";
import { SiteControls } from "./SiteControls";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

/** The document every locale shares: html/body, fonts, theme, structured data, controls and analytics. */
export function LocaleShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  // Start the hero likeness download with the HTML, not after the 3D code has loaded (same request useGLTF makes).
  // Low priority: on a slow line it must not hold back the page's own scripts, which start the 3D code download.
  preload("/models/me.glb", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  // Its Draco decoder too, which DRACOLoader would otherwise only request once the 3D code has run.
  preload("/draco/draco_wasm_wrapper.js", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  preload("/draco/draco_decoder.wasm", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  const t = getDictionary(locale);
  // No email or phone: structured data is public and scraped.
  const jsonLd = siteStructuredData(locale === "de" ? cvDe : cvEn, SITE_URL);
  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      {/* App Router layouts own <head>; next/head is for the Pages Router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg text-ink font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <SiteControls locale={locale} t={t} />
        <ReducedMotionNotice t={t} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
