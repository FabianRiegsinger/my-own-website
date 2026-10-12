import type { CV } from "@/content/types";
import { formatMonth } from "./format";
import { Eyebrow, Section, Title } from "./Section";

const row = "grid gap-2 border-t border-ink/25 py-6 sm:grid-cols-[9rem_1fr] sm:gap-6";
const date = "text-sm font-semibold tabular-nums text-accent";

export function Timeline({ cv }: { cv: CV }) {
  return (
    <Section id="timeline">
      <div className="max-w-2xl">
        <Eyebrow n={2}>Career</Eyebrow>
        <Title>Eight years in automotive software</Title>
        <ol className="mt-12 border-b border-ink/25">
          {[...cv.education].reverse().map((e) => (
            <li key={e.degree} className={row}>
              <p className={date}>{formatMonth(e.end)}</p>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{e.degree}</h3>
                <p className="text-muted">{e.school}</p>
                <p className="mt-2">{e.note}</p>
              </div>
            </li>
          ))}
          {[...cv.experience].reverse().map((e) => (
            <li key={e.company} className={row}>
              <p className={date}>
                {formatMonth(e.start)} – {formatMonth(e.end)}
              </p>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{e.company}</h3>
                <p className="text-muted">{e.role}</p>
                <ul className="mt-4 space-y-2 leading-relaxed">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold uppercase tracking-wider text-muted" aria-label="Tags">
                  {e.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
