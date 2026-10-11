import type { CV } from "@/content/types";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { ACCENT, Eyebrow, Section, Title } from "./Section";

const linkClass = "pill min-h-11 min-w-11 cursor-pointer px-5 py-3";
const footerLink = "inline-flex min-h-11 min-w-11 items-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline";

export function Contact({ cv }: { cv: CV }) {
  const { links } = cv.profile;
  return (
    <Section id="contact" accent={ACCENT.mint}>
      <Eyebrow>Contact</Eyebrow>
      <Title>Let&apos;s talk</Title>
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
      <footer className="mt-24 flex gap-6">
        <a href="/impressum" className={footerLink}>Impressum</a>
        <a href="/privacy" className={footerLink}>Privacy</a>
      </footer>
    </Section>
  );
}
