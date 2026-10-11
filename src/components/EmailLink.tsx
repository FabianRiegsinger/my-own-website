"use client";

import type { ReactNode } from "react";

/** Assembles the address only on click so it never appears in the HTML (spam scrapers). */
export function EmailLink({ user, domain, children, className }: { user: string; domain: string; children: ReactNode; className?: string }) {
  return (
    <a
      href="#"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${user}@${domain}`;
      }}
    >
      {children}
    </a>
  );
}
