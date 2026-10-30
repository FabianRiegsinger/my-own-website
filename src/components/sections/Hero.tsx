import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { ContactJumpLink } from "./JumpLink";
import { Section } from "./Section";

const PILL =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-surface/55 px-5 text-sm font-medium ring-1 ring-surface/80 transition-colors duration-200 hover:bg-surface/90";

export function Hero({ cv, t, showFigure = false }: { cv: CV; t: Dictionary; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <div>
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl desk:text-[min(3.75rem,5.5vw)]">{cv.profile.name}</h1>
          <p className="mt-4 text-xl text-muted sm:text-2xl">{cv.profile.headline}</p>
          <p className="mt-8 text-xl font-semibold tracking-tight sm:text-2xl">{t.hero.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#about" className={PILL}>
              {t.hero.seeStory}
              <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <ContactJumpLink className={PILL}>{t.hero.contact}</ContactJumpLink>
          </div>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt={t.hero.avatarAlt} className="fallback-figure mt-8 w-full max-w-xs rounded-3xl" />
        )}
      </div>
    </Section>
  );
}
