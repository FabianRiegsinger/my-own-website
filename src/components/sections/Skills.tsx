import type { CV } from "@/content/types";
import { Bento, Eyebrow, Section, Tile, Title } from "./Section";

// Uneven spans keep the grid from reading as a uniform table: 3+3, then 2+2+2.
const SPANS = ["sm:col-span-3", "sm:col-span-3", "sm:col-span-2", "sm:col-span-2", "sm:col-span-2"];

export function Skills({ cv }: { cv: CV }) {
  return (
    <Section id="skills">
      <Eyebrow>Skills</Eyebrow>
      <Title>What I work with</Title>
      <Bento>
        {cv.skills.map((g, gi) => (
          <Tile key={g.group} span={SPANS[gi] ?? "sm:col-span-2"}>
            <h3 className="font-semibold">{g.group}</h3>
            <ul className="mt-4 space-y-3">
              {g.items.map((i) => (
                <li key={i.name}>
                  <span className="block text-sm break-words">{i.name}</span>
                  <span className="mt-1 flex gap-1" role="img" aria-label={`${i.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) =>
                      n <= i.level ? <span key={n} data-accent className="h-1.5 flex-1 rounded-full bg-glow" /> : <span key={n} className="h-1.5 flex-1 rounded-full bg-ink/10" />,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Tile>
        ))}
      </Bento>
    </Section>
  );
}
