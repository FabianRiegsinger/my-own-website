import type { CV } from "@/content/types";
import { Eyebrow, Section, Title } from "./Section";

export function Skills({ cv }: { cv: CV }) {
  return (
    <Section id="skills">
      <Eyebrow n="03">Skills</Eyebrow>
      <Title>What I work with</Title>
      <div className="mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        {cv.skills.map((g) => (
          <div key={g.group} className="brutal min-w-0 bg-white p-5">
            <h3 className="-mx-5 -mt-5 mb-4 border-b-[3px] border-ink bg-signal px-5 py-2 font-mono text-sm font-bold uppercase">{g.group}</h3>
            <ul className="space-y-3">
              {g.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-4">
                  <span className="min-w-0 font-medium break-words">{i.name}</span>
                  <span className="flex shrink-0 gap-0.5" role="img" aria-label={`${i.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-3 w-3 border-2 border-ink ${n <= i.level ? "bg-ink" : "bg-white"}`} />
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
