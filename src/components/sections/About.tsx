import type { CV } from "@/content/types";
import { Eyebrow, Section } from "./Section";

export function About({ cv }: { cv: CV }) {
  return (
    <Section id="about">
      <div className="max-w-xl">
        <Eyebrow>About</Eyebrow>
        <p className="text-xl leading-relaxed sm:text-2xl">{cv.profile.summary}</p>
        <p className="mt-6 text-muted">{cv.profile.location}</p>
      </div>
    </Section>
  );
}
