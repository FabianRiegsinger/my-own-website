import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleShell } from "@/components/LocaleShell";
import { cvDe } from "@/content/cv.de";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const title = `${cvDe.profile.name} — ${cvDe.profile.headline}`;
const description = cvDe.profile.summary.split(". ")[0] + ".";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { title, description, type: "profile", url: "/de", locale: "de_DE" },
  twitter: { card: "summary_large_image", title, description },
};

export default function GermanLayout({ children }: { children: ReactNode }) {
  return <LocaleShell locale="de">{children}</LocaleShell>;
}
