import { siGithub, siXing } from "simple-icons";

// LinkedIn was removed from simple-icons; path is the standard LinkedIn "in" mark from earlier releases.
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const MAIL_PATH = "M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l10 6.25L22 6.4V6H2zm20 2.75-10 6.25L2 8.75V18h20V8.75z";

export const ICONS = { github: siGithub.path, linkedin: LINKEDIN_PATH, xing: siXing.path, email: MAIL_PATH };

// Brand colours as on the real sites. GitHub's mark is black on light and white on dark, so it keeps the text colour.
export const ICON_COLORS = { linkedin: "#0a66c2", xing: `#${siXing.hex}` };

export function Icon({ path, color }: { path: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-current" style={color ? { color } : undefined} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
