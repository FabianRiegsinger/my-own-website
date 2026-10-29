import type { CV } from "@/content/types";
import { JOB_STATIONS } from "@/lib/scroll-map";
import { formatMonth } from "./format";
import { Eyebrow, Section } from "./Section";

const title = "text-4xl font-semibold tracking-tight sm:text-5xl";

/** Career as three pages, oldest first: education, then one page per job. */
export function Timeline({ cv }: { cv: CV }) {
  const jobs = [...cv.experience].reverse();
  return (
    <>
      <Section id="education">
        <Eyebrow>Career · Studies</Eyebrow>
        <h2 className={title}>Education</h2>
        <ol className="mt-10 space-y-10 border-l border-ink/15 pl-6">
          {[...cv.education].reverse().map((e) => (
            <li key={e.degree} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-bg" aria-hidden="true" />
              <p className="text-sm font-medium text-accent">{formatMonth(e.end)}</p>
              <h3 className="mt-1 text-xl font-semibold">{e.degree}</h3>
              <p className="text-muted">{e.school}</p>
              <p className="mt-2">{e.note}</p>
            </li>
          ))}
        </ol>
      </Section>
      {jobs.map((e, i) => (
        <Section key={e.company} id={JOB_STATIONS[i]}>
          <Eyebrow>Career · {i === jobs.length - 1 ? "Today" : e.start.slice(0, 4)}</Eyebrow>
          <h2 className={title}>{e.company}</h2>
          <p className="mt-2 text-lg text-muted">{e.role}</p>
          <p className="mt-1 text-sm font-medium text-accent">
            {formatMonth(e.start)} – {formatMonth(e.end)}
          </p>
          <ul className="mt-6 space-y-2 leading-relaxed">
            {e.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
            {e.tags.map((t) => (
              <li key={t} className="rounded-full bg-surface/60 px-3 py-1 text-sm text-ink ring-1 ring-surface/80">
                {t}
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
