import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Eyebrow, Section } from "./Section";

const linkClass =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 rounded-full bg-surface/55 px-5 py-3 font-medium ring-1 ring-surface/80 transition-colors duration-200 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Contact({ cv, t }: { cv: CV; t: Dictionary }) {
  const { links } = cv.profile;
  return (
    <Section id="contact">
      <Eyebrow>{t.contact.eyebrow}</Eyebrow>
      <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.contact.title}</h2>
      <div className="mt-10 flex flex-wrap gap-3">
        <a href={links.github} className={linkClass} rel="me">
          <Icon path={ICONS.github} /> GitHub
        </a>
        <a href={links.linkedin} className={linkClass} rel="me">
          <Icon path={ICONS.linkedin} /> LinkedIn
        </a>
        <a href={links.xing} className={linkClass} rel="me">
          <Icon path={ICONS.xing} /> Xing
        </a>
        <EmailLink user={links.email.user} domain={links.email.domain} className={linkClass}>
          <Icon path={ICONS.email} /> {t.contact.email}
        </EmailLink>
      </div>
      <footer className="mt-16 flex gap-6 text-sm text-muted">
        <a href="/impressum" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">{t.contact.impressum}</a>
        <a href="/privacy" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">{t.contact.privacy}</a>
      </footer>
    </Section>
  );
}
