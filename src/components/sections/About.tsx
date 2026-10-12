import type { CV } from "@/content/types";
import { Bento, Eyebrow, Section, Tile } from "./Section";

export function About({ cv }: { cv: CV }) {
  return (
    <Section id="about">
      <Eyebrow>About</Eyebrow>
      <Bento>
        <Tile span="sm:col-span-4 sm:row-span-3" className="sm:p-8">
          <p className="text-xl leading-relaxed sm:text-2xl">{cv.profile.summary}</p>
          <p className="mt-6 text-muted">{cv.profile.location}</p>
        </Tile>
        {cv.profile.stats.map((s) => (
          <Tile key={s.label} span="sm:col-span-2">
            <p className="text-4xl font-semibold tracking-tight text-accent">{s.value}</p>
            <p className="mt-1 text-sm leading-snug text-muted">{s.label}</p>
          </Tile>
        ))}
      </Bento>
    </Section>
  );
}
