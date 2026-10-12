import type { CV } from "@/content/types";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Eyebrow, Section } from "./Section";

const linkClass =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 border-b-2 border-ink py-2 font-semibold transition-colors duration-200 hover:border-accent hover:text-accent";

export function Contact({ cv }: { cv: CV }) {
  const { links } = cv.profile;
  return (
    <Section id="contact">
      <div className="max-w-2xl">
        <Eyebrow n={5}>Contact</Eyebrow>
        <h2>
          <EmailLink
            user={links.email.user}
            domain={links.email.domain}
            className="inline-flex min-h-11 cursor-pointer text-5xl font-extrabold leading-[0.92] tracking-[-0.04em] underline decoration-4 underline-offset-[0.12em] transition-colors duration-200 hover:text-accent sm:text-7xl lg:text-8xl"
          >
            Let&apos;s talk.
          </EmailLink>
        </h2>
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
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
      </div>
      <footer className="mt-24 flex gap-6 border-t border-ink/25 pt-4 text-sm text-muted">
        <a href="/impressum" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">Impressum</a>
        <a href="/privacy" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">Privacy</a>
      </footer>
    </Section>
  );
}
