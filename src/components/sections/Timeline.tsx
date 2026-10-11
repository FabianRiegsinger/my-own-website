import type { CV } from "@/content/types";
import { formatMonth } from "./format";
import { Eyebrow, Section, Title } from "./Section";

const date = "font-mono text-sm font-bold uppercase text-accent";

export function Timeline({ cv }: { cv: CV }) {
  return (
    <Section id="timeline">
      <div className="max-w-2xl">
        <Eyebrow n="02">Career</Eyebrow>
        <Title>Eight years in automotive software</Title>
        <ol className="mt-12 space-y-12 border-l-[3px] border-ink pl-6">
          {[...cv.education].reverse().map((e) => (
            <li key={e.degree} className="relative">
              <span className="absolute -left-[33px] top-1 h-4 w-4 border-[3px] border-ink bg-bg" aria-hidden="true" />
              <p className={date}>{formatMonth(e.end)}</p>
              <h3 className="mt-1 text-xl font-bold">{e.degree}</h3>
              <p className="font-mono text-sm">{e.school}</p>
              <p className="mt-2">{e.note}</p>
            </li>
          ))}
          {[...cv.experience].reverse().map((e) => (
            <li key={e.company} className="relative">
              <span className="absolute -left-[33px] top-1 h-4 w-4 border-[3px] border-ink bg-signal" aria-hidden="true" />
              <p className={date}>
                {formatMonth(e.start)} – {formatMonth(e.end)}
              </p>
              <h3 className="mt-1 text-2xl font-bold uppercase">{e.company}</h3>
              <p className="font-mono text-sm">{e.role}</p>
              <ul className="mt-4 space-y-2 leading-relaxed">
                {e.highlights.map((h) => (
                  <li key={h} className="before:mr-2 before:font-mono before:content-['■']">
                    {h}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {e.tags.map((t) => (
                  <li key={t} className="border-2 border-ink bg-white px-2 py-0.5 font-mono text-xs font-bold uppercase">
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
