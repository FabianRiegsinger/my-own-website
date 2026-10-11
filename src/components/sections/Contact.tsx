import type { CV } from "@/content/types";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Eyebrow, Section, Title } from "./Section";

const linkClass = "brutal brutal-press inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 bg-signal px-5 py-3 font-bold uppercase";
const footerLink = "inline-flex min-h-11 min-w-11 items-center font-mono text-sm uppercase underline decoration-2 underline-offset-4 hover:bg-signal";

export function Contact({ cv }: { cv: CV }) {
  const { links } = cv.profile;
  return (
    <Section id="contact">
      <Eyebrow n="05">Contact</Eyebrow>
      <Title>Let&apos;s talk</Title>
      <div className="mt-10 flex flex-wrap gap-4">
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
      <footer className="mt-24 flex gap-6">
        <a href="/impressum" className={footerLink}>Impressum</a>
        <a href="/privacy" className={footerLink}>Privacy</a>
      </footer>
    </Section>
  );
}
