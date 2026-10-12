import type { CV } from "@/content/types";
import { Eyebrow, Section } from "./Section";

export function About({ cv }: { cv: CV }) {
  return (
    <Section id="about">
      <div className="max-w-xl">
        <Eyebrow n={1}>About</Eyebrow>
        <p className="text-2xl font-medium leading-snug tracking-tight sm:text-3xl">{cv.profile.summary}</p>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-muted">{cv.profile.location}</p>
      </div>
    </Section>
  );
}
