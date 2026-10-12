import type { CV } from "@/content/types";
import { Eyebrow, Section, Title } from "./Section";

export function Skills({ cv }: { cv: CV }) {
  return (
    <Section id="skills">
      <div className="max-w-2xl">
        <Eyebrow n={3}>Skills</Eyebrow>
        <Title>What I work with</Title>
      </div>
      <div className="mt-12 grid max-w-xl gap-x-10 gap-y-10 sm:grid-cols-2">
        {cv.skills.map((g) => (
          <div key={g.group} className="min-w-0 border-t-2 border-ink pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">{g.group}</h3>
            <ul className="mt-4">
              {g.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-4 border-b border-ink/15 py-2">
                  <span className="min-w-0 break-words">{i.name}</span>
                  <span className="flex shrink-0 gap-1" role="img" aria-label={`${i.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-2.5 w-2.5 ${n <= i.level ? "bg-ink" : "bg-ink/15"}`} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
