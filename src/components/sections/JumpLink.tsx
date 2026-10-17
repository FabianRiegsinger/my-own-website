"use client";

import type { ReactNode } from "react";
import { contactJump } from "@/lib/jump";

/** Link to the contact page that lands there at once, without scrolling past (and animating) every page between. */
export function ContactJumpLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a
      href="#contact"
      className={className}
      onClick={(e) => {
        const target = document.getElementById("contact");
        if (!target) return;
        e.preventDefault();
        contactJump.snap = contactJump.clean = true;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        history.replaceState(null, "", "#contact");
      }}
    >
      {children}
    </a>
  );
}
