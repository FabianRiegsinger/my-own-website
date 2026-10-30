import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { Eyebrow, Section } from "./Section";

export function About({ cv, t }: { cv: CV; t: Dictionary }) {
  return (
    <Section id="about">
      <div className="max-w-xl">
        <Eyebrow>{t.about.eyebrow}</Eyebrow>
        <p className="text-xl leading-relaxed sm:text-2xl">{cv.profile.summary}</p>
        <p className="mt-6 text-muted">{cv.profile.location}</p>
      </div>
    </Section>
  );
}
