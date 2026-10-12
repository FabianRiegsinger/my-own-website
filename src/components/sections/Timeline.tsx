import type { CV } from "@/content/types";
import { formatMonth } from "./format";
import { Eyebrow, Section } from "./Section";

export function Timeline({ cv }: { cv: CV }) {
  return (
    <Section id="timeline">
      <div className="max-w-2xl">
        <Eyebrow>Career</Eyebrow>
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Eight years in automotive software</h2>
        <ol className="mt-12 space-y-12 border-l border-ink/15 pl-6">
          {[...cv.education].reverse().map((e) => (
            <li key={e.degree} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-white" aria-hidden="true" />
              <p className="text-sm font-medium text-accent">{formatMonth(e.end)}</p>
              <h3 className="mt-1 text-xl font-semibold">{e.degree}</h3>
              <p className="text-muted">{e.school}</p>
              <p className="mt-2">{e.note}</p>
            </li>
          ))}
          {[...cv.experience].reverse().map((e) => (
            <li key={e.company} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-accent" aria-hidden="true" />
              <p className="text-sm font-medium text-accent">
                {formatMonth(e.start)} – {formatMonth(e.end)}
              </p>
              <h3 className="mt-1 text-2xl font-semibold">{e.company}</h3>
              <p className="text-muted">{e.role}</p>
              <ul className="mt-4 space-y-2 leading-relaxed">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {e.tags.map((t) => (
                  <li key={t} className="rounded-full bg-white/60 px-3 py-1 ring-1 ring-white/80 text-sm text-ink">
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
