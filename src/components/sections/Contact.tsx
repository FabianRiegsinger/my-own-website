import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { BusinessCard } from "./BusinessCard";
import { Section } from "./Section";

const LEGAL_LINK =
  "inline-flex min-h-11 min-w-11 items-center justify-center px-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent";

export function Contact({ cv, t }: { cv: CV; t: Dictionary }) {
  return (
    <Section id="contact" bare className="relative">
      <BusinessCard profile={cv.profile} t={t.contact} />
      {/* At the bottom of the screen, on the section's left gutter. The page is 100vh (the screen with the browser's
          toolbars hidden); lifting by the difference to 100svh keeps it clear of a phone's toolbars when they show. */}
      <footer className="glass [--glass-glow:0%] absolute bottom-[calc(100lvh-100svh+1.5rem+env(safe-area-inset-bottom))] left-4 flex w-fit gap-2 px-4 text-sm text-muted sm:left-8 desk:left-[3vw]">
        <a href={t.contact.impressumHref} className={LEGAL_LINK}>{t.contact.impressum}</a>
        <a href={t.contact.privacyHref} className={LEGAL_LINK}>{t.contact.privacy}</a>
      </footer>
    </Section>
  );
}
