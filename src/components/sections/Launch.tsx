import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { Eyebrow, Section } from "./Section";

/** What comes next, as a launch countdown: each step a challenge he is heading for, lift-off hands over to contact. */
export function Launch({ cv, t }: { cv: CV; t: Dictionary }) {
  const { intro, steps, liftoff } = cv.next;
  return (
    <Section id="launch">
      <Eyebrow>{t.launch.eyebrow}</Eyebrow>
      <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.launch.title}</h2>
      <p className="mt-4 text-lg leading-relaxed">{intro}</p>
      <ol className="mt-8 space-y-5">
        {steps.map((s) => (
          <li key={s.label} className="flex gap-4">
            <span className="w-12 shrink-0 font-mono text-lg font-semibold text-ignition">{s.label}</span>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 leading-relaxed text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 font-medium">{liftoff}</p>
      <a
        href="#contact"
        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-bg transition-colors duration-200 hover:bg-ignition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t.launch.countdown} <span aria-hidden="true">→</span>
      </a>
    </Section>
  );
}
