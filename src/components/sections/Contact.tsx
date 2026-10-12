import type { CV } from "@/content/types";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Bento, Eyebrow, Section, Tile } from "./Section";

const linkClass =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 rounded-full bg-bg px-5 py-3 font-medium transition-colors duration-200 hover:bg-ink hover:text-white";

export function Contact({ cv }: { cv: CV }) {
  const { links } = cv.profile;
  return (
    <Section id="contact">
      <Eyebrow>Contact</Eyebrow>
      <Bento>
        <Tile className="sm:p-10">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Let&apos;s talk</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <EmailLink user={links.email.user} domain={links.email.domain} className={`${linkClass} bg-glow! text-ink hover:bg-ink! hover:text-white`}>
              <Icon path={ICONS.email} /> Email
            </EmailLink>
            <a href={links.github} className={linkClass} rel="me">
              <Icon path={ICONS.github} /> GitHub
            </a>
            <a href={links.linkedin} className={linkClass} rel="me">
              <Icon path={ICONS.linkedin} /> LinkedIn
            </a>
            <a href={links.xing} className={linkClass} rel="me">
              <Icon path={ICONS.xing} /> Xing
            </a>
          </div>
        </Tile>
      </Bento>
      <footer className="mt-12 flex gap-6 text-sm text-muted">
        <a href="/impressum" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">Impressum</a>
        <a href="/privacy" className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline">Privacy</a>
      </footer>
    </Section>
  );
}
