"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { EmailLink } from "../EmailLink";
import { ICONS, Icon } from "./icons";
import { Eyebrow } from "./Section";
import { useTilt } from "./useTilt";

const PILL =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded-full bg-surface/55 px-4 text-sm font-medium ring-1 ring-surface/80 transition-colors duration-200 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const TILE =
  "flex min-h-11 whitespace-nowrap min-w-11 cursor-pointer items-center gap-3 rounded-2xl bg-surface/55 px-4 py-3 font-medium ring-1 ring-surface/80 transition-colors duration-200 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
// Both faces and an empty strut share one grid cell: the strut holds the business-card ratio (85 x 55 mm) as a minimum,
// the faces stretch to the row, so the card is as tall as the taller face. (The ratio sits on the strut, not the faces:
// Safari does not let an overflow-clipped box with an aspect-ratio grow to its content, and cut the back face off.)
const FACE = "glass card-face flex min-w-0 flex-col p-6 [grid-area:1/1] sm:p-8 desk:p-7";

const FLIP_PATH = "M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z";
const PIN_PATH = "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Contact page as a glass business card: the front shows who, the back how to reach me. Both faces stay in the
 * document (screen readers read both); keyboard focus entering a face turns that face up.
 */
export function BusinessCard({ profile, t }: { profile: CV["profile"]; t: Dictionary["contact"] }) {
  const [flipped, setFlipped] = useState(false);
  const tilt = useTilt<HTMLDivElement>();
  const flipButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const { links } = profile;

  const onBackKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    setFlipped(false);
    flipButton.current?.focus({ preventScroll: true });
  };

  return (
    <div
      {...tilt}
      data-flipped={flipped}
      // desk:max-w-[36vw] inside the section's desk:px-[3vw] gutter = PANEL_EDGE in scroll-map; keep them in sync.
      className="reveal grid w-full grid-cols-[minmax(0,1fr)] transition-transform duration-300 ease-out desk:max-w-[36vw]"
    >
      <div className="pointer-events-none aspect-[85/55] w-full [grid-area:1/1]" aria-hidden="true" />
      {/* The front is the page's glass panel (data-glass, one per page); the back is its other side. */}
      <div data-glass className={`${FACE} card-front cursor-pointer`} onFocus={() => setFlipped(false)} onClick={() => setFlipped(true)}>
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface/55 text-lg font-semibold tracking-tight text-accent ring-1 ring-surface/80" aria-hidden="true">
            {initials(profile.name)}
          </span>
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <div className="mt-auto pt-6">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl desk:text-[min(2.25rem,3vw)]">{profile.name}</p>
          <p className="mt-1 text-muted">{profile.headline}</p>
          <div className="mt-5 h-px w-full" style={{ background: "linear-gradient(90deg, var(--blob-a), var(--blob-b), var(--blob-c))" }} aria-hidden="true" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d={PIN_PATH} />
              </svg>
              {profile.location}
            </p>
            <button
              ref={flipButton}
              type="button"
              className={PILL}
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
                firstLink.current?.focus({ preventScroll: true });
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d={FLIP_PATH} />
              </svg>
              {t.flip}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${FACE} card-back @container cursor-pointer`}
        onFocus={() => setFlipped(true)}
        onKeyDown={onBackKey}
        // Like the front, a click anywhere turns it over, except on a contact link: that one opens.
        onClick={(e) => {
          if (!(e.target instanceof Element && e.target.closest("a"))) setFlipped(false);
        }}
      >
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h2>
        {/* Two columns once the card is wide enough for "LinkedIn" beside an icon; a narrow card stacks them. */}
        <div className="mt-5 grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
          <a ref={firstLink} href={links.github} className={TILE} rel="me">
            <Icon path={ICONS.github} /> GitHub
          </a>
          <a href={links.linkedin} className={TILE} rel="me">
            <Icon path={ICONS.linkedin} /> LinkedIn
          </a>
          <a href={links.xing} className={TILE} rel="me">
            <Icon path={ICONS.xing} /> Xing
          </a>
          <EmailLink user={links.email.user} domain={links.email.domain} className={TILE}>
            <Icon path={ICONS.email} /> {t.email}
          </EmailLink>
        </div>
        <div className="mt-auto flex justify-end pt-4">
          <button
            type="button"
            className={PILL}
            onClick={() => {
              setFlipped(false);
              flipButton.current?.focus({ preventScroll: true });
            }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 -scale-x-100 fill-current" aria-hidden="true">
              <path d={FLIP_PATH} />
            </svg>
            {t.flipBack}
          </button>
        </div>
      </div>
    </div>
  );
}
