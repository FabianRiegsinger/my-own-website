import type { CV } from "@/content/types";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Eyebrow, Section } from "./Section";

const linkClass =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 rounded-full bg-white/55 px-5 py-3 font-medium ring-1 ring-white/80 transition-colors duration-200 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Contact({ cv }: { cv: CV }) {
  const { links } = cv.profile;
  return (
    <Section id="contact">
      <Eyebrow>Contact</Eyebrow>
      <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Let&apos;s talk</h2>
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
          <Icon path={ICONS.email} /> Email
        </EmailLink>
      </div>
      <footer className="mt-16 flex gap-6 text-sm text-muted">
        <a href="/impressum" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">Impressum</a>
        <a href="/privacy" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">Privacy</a>
      </footer>
    </Section>
  );
}
