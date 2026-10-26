"use client";

import { toggleTheme } from "@/lib/theme";

/** Round glass button that flips light/dark; the sun or moon shown comes from `data-theme` (CSS), so it needs no state. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`group grid size-11 cursor-pointer place-items-center rounded-full bg-surface/55 text-ink ring-1 ring-surface/80 transition-colors duration-200 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <svg viewBox="0 0 24 24" className="col-start-1 row-start-1 size-5 transition-all duration-500 motion-reduce:transition-none dark:scale-50 dark:-rotate-90 dark:opacity-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg viewBox="0 0 24 24" className="col-start-1 row-start-1 size-5 scale-50 rotate-90 opacity-0 transition-all duration-500 motion-reduce:transition-none dark:scale-100 dark:rotate-0 dark:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    </button>
  );
}
