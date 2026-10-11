import type { CV } from "@/content/types";
import { Eyebrow, Section } from "./Section";

export function Skills({ cv }: { cv: CV }) {
  return (
    <Section id="skills">
      <Eyebrow>Skills</Eyebrow>
      <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">What I work with</h2>
      <div className="mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        {cv.skills.map((g) => (
          <div key={g.group} className="rounded-3xl bg-white/80 p-6">
            <h3 className="text-lg font-semibold">{g.group}</h3>
            <ul className="mt-4 space-y-3">
              {g.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-4">
                  <span>{i.name}</span>
                  <span className="flex gap-1" role="img" aria-label={`${i.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-2 w-2 rounded-full ${n <= i.level ? "bg-accent" : "bg-ink/15"}`} />
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
