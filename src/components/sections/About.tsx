import type { CV } from "@/content/types";
import { ACCENT, Eyebrow, Section } from "./Section";

export function About({ cv }: { cv: CV }) {
  return (
    <Section id="about" accent={ACCENT.mint}>
      <div className="max-w-xl">
        <Eyebrow>About</Eyebrow>
        <p className="text-2xl font-semibold leading-relaxed sm:text-3xl">{cv.profile.summary}</p>
        <p className="mt-6 text-muted">{cv.profile.location}</p>
      </div>
    </Section>
  );
}
