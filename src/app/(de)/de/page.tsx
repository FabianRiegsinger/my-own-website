import type { Metadata } from "next";
import { ExperienceGate } from "@/components/ExperienceGate";
import { StaticPage } from "@/components/StaticPage";
import { cvDe as cv } from "@/content/cv.de";
import { getDictionary } from "@/i18n";
import { alternatesFor } from "@/lib/locale";
import { loadProjects } from "@/lib/projects-cache";
import { profilePageStructuredData } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/de", languages: alternatesFor("/") } };

export default async function HomeDe() {
  const projects = await loadProjects();
  const t = getDictionary("de");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageStructuredData(cv, "de", SITE_URL)) }} />
      <ExperienceGate cv={cv} projects={projects} t={t}>
        <StaticPage cv={cv} projects={projects} t={t} />
      </ExperienceGate>
    </>
  );
}
