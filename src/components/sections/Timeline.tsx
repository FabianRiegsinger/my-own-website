import type { CV } from "@/content/types";
import { formatMonth } from "./format";
import { ACCENT, Eyebrow, Section, Title } from "./Section";

const date = "text-sm font-extrabold text-(--accent)";
const tag = "rounded-full bg-white/10 px-3 py-1 text-sm font-semibold";

export function Timeline({ cv }: { cv: CV }) {
  return (
    <Section id="timeline" accent={ACCENT.lavender}>
      <div className="max-w-2xl">
        <Eyebrow>Career</Eyebrow>
        <Title>Eight years in automotive software</Title>
        <ol className="mt-12 space-y-12 border-l-2 border-(--accent)/40 pl-6">
          {[...cv.education].reverse().map((e) => (
            <li key={e.degree} className="relative">
              <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-(--accent) bg-bg" aria-hidden="true" />
              <p className={date}>{formatMonth(e.end)}</p>
              <h3 className="mt-1 text-xl font-extrabold">{e.degree}</h3>
              <p className="text-muted">{e.school}</p>
              <p className="mt-2 text-muted">{e.note}</p>
            </li>
          ))}
          {[...cv.experience].reverse().map((e) => (
            <li key={e.company} className="relative">
              <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-(--accent) shadow-[0_0_16px_var(--accent)]" aria-hidden="true" />
              <p className={date}>
                {formatMonth(e.start)} – {formatMonth(e.end)}
              </p>
              <h3 className="mt-1 text-2xl font-black">{e.company}</h3>
              <p className="text-muted">{e.role}</p>
              <ul className="mt-4 space-y-2 leading-relaxed text-muted">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {e.tags.map((t) => (
                  <li key={t} className={tag}>
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
