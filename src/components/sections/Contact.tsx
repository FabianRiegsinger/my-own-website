import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { BusinessCard } from "./BusinessCard";
import { Section } from "./Section";

const LEGAL_LINK =
  "inline-flex min-h-11 min-w-11 items-center justify-center px-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent";

export function Contact({ cv, t }: { cv: CV; t: Dictionary }) {
  return (
    <Section id="contact" bare>
      <div className="w-full desk:max-w-[36vw]">
        <BusinessCard profile={cv.profile} t={t.contact} />
        <footer className="glass mt-6 flex w-fit gap-2 px-4 text-sm text-muted">
          <a href={t.contact.impressumHref} className={LEGAL_LINK}>{t.contact.impressum}</a>
          <a href={t.contact.privacyHref} className={LEGAL_LINK}>{t.contact.privacy}</a>
        </footer>
      </div>
    </Section>
  );
}
