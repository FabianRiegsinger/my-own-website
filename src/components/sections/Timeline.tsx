import type { CV } from "@/content/types";
import { formatMonth } from "./format";
import { Bento, Eyebrow, Section, Tile, Title } from "./Section";

export function Timeline({ cv }: { cv: CV }) {
  const jobs = [...cv.experience].reverse();
  return (
    <Section id="timeline">
      <Eyebrow>Career</Eyebrow>
      <Title>Eight years in automotive software</Title>
      <Bento>
        {[...cv.education].reverse().map((e) => (
          <Tile key={e.degree} span="sm:col-span-3">
            <p className="text-sm font-medium text-accent">{formatMonth(e.end)}</p>
            <h3 className="mt-1 text-lg font-semibold leading-snug">{e.degree}</h3>
            <p className="text-sm text-muted">{e.school}</p>
            <p className="mt-2 text-sm">{e.note}</p>
          </Tile>
        ))}
        {jobs.map((e, i) => {
          const current = i === jobs.length - 1;
          return (
            <Tile key={e.company} className={current ? "bg-ink! text-white" : ""}>
              <p className={`text-sm font-medium ${current ? "text-glow" : "text-accent"}`}>
                {formatMonth(e.start)} – {formatMonth(e.end)}
              </p>
              <h3 className="mt-1 text-2xl font-semibold">{e.company}</h3>
              <p className={current ? "text-white/70" : "text-muted"}>{e.role}</p>
              <ul className="mt-4 space-y-2 leading-relaxed">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {e.tags.map((t) => (
                  <li key={t} className={`rounded-full px-3 py-1 text-sm ${current ? "bg-white/10" : "bg-bg"}`}>
                    {t}
                  </li>
                ))}
              </ul>
            </Tile>
          );
        })}
      </Bento>
    </Section>
  );
}
