import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleShell } from "@/components/LocaleShell";
import { cvEn as cv } from "@/content/cv.en";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const title = `${cv.profile.name} — ${cv.profile.headline}`;
const description = cv.profile.summary.split(". ")[0] + ".";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { title, description, type: "profile", url: "/", locale: "en_US" },
  twitter: { card: "summary_large_image", title, description },
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <LocaleShell locale="en">{children}</LocaleShell>;
}
