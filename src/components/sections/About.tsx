import type { CV } from "@/content/types";
import { Eyebrow, Section } from "./Section";

export function About({ cv }: { cv: CV }) {
  return (
    <Section id="about">
      <div className="max-w-xl">
        <Eyebrow n="01">About</Eyebrow>
        <p className="text-2xl font-medium leading-snug sm:text-3xl">{cv.profile.summary}</p>
        <p className="mt-6 font-mono text-sm uppercase">↳ {cv.profile.location}</p>
      </div>
    </Section>
  );
}
