import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const BUTTON =
  "size-10 rounded-full text-ink transition-all duration-300 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none";

/**
 * Glass capsule pinned top-right on every page: back to the landing page, and the light/dark toggle. The home button
 * folds away while the landing page itself is being read (data-page, ActivePage).
 */
export function SiteControls() {
  return (
    <nav aria-label="Site" className="fixed top-4 right-4 z-40 flex items-center gap-1 rounded-full bg-surface/55 p-1 shadow-lg shadow-black/5 ring-1 ring-surface/80 backdrop-blur-xl">
      <Link
        href="/#hero"
        aria-label="Back to the start"
        title="Back to the start"
        className={`${BUTTON} grid place-items-center overflow-hidden [html[data-page=hero]_&]:invisible [html[data-page=hero]_&]:-mr-1 [html[data-page=hero]_&]:w-0 [html[data-page=hero]_&]:opacity-0`}
      >
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
        </svg>
      </Link>
      <ThemeToggle className={BUTTON} />
    </nav>
  );
}
