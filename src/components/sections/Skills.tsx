import type { CV } from "@/content/types";
import { ACCENT, Eyebrow, Section, Title } from "./Section";

export function Skills({ cv }: { cv: CV }) {
  return (
    <Section id="skills" accent={ACCENT.cyan}>
      <Eyebrow>Skills</Eyebrow>
      <Title>What I work with</Title>
      <div className="mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        {cv.skills.map((g) => (
          <div key={g.group} className="min-w-0 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <h3 className="text-lg font-extrabold">{g.group}</h3>
            <ul className="mt-4 space-y-3">
              {g.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-4">
                  <span className="min-w-0 break-words text-muted">{i.name}</span>
                  <span className="flex shrink-0 gap-1" role="img" aria-label={`${i.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-1.5 w-4 rounded-full ${n <= i.level ? "bg-(--accent) shadow-[0_0_8px_var(--accent)]" : "bg-white/15"}`} />
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
