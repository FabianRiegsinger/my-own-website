# German Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the whole site in German at `/de` next to English at `/`, with a DE/EN switch in the top-right control capsule and an IP-based default for visitors from DE, AT, CH and LI.

**Architecture:** Two root layouts in route groups: `(en)` owns `/`, `(de)` owns `/de`, each rendering its own `<html lang>`. A proxy (`src/proxy.ts`) redirects `/` to `/de` only for a German-speaking country with no `lang` cookie, or a `lang=de` cookie. A route handler (`/language`) sets the cookie and redirects, so the switch works without JavaScript. All locale decisions are pure functions in `src/lib/locale.ts`, tested with vitest. Pages stay statically rendered; the proxy runs per request but does not turn pages dynamic.

**Tech Stack:** Next.js 16.4.3 (App Router, `cacheComponents`), React 19.3.0, TypeScript, Tailwind CSS v4, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-german-localization-design.md`. Deviations from the spec, all decided here:
- Routing uses route groups, not a `[locale]` segment (see Architecture).
- Pages are statically rendered. The spec's "per-request render" is dropped; the proxy handles the redirect.
- The language switch is a route handler (`/language?to=de&page=/`) that sets the cookie and redirects, not a server action or a proxy rewrite. It works without JavaScript.

## Global Constraints

- Cookie name: `lang`, values `en` or `de`, `Path=/`, `Max-Age=31536000`, `SameSite=Lax`.
- Country header: `x-vercel-ip-country`. German-speaking countries: `DE`, `AT`, `CH`, `LI`.
- Visitors not matched by any rule see English. A missing country header (local dev) means English.
- German URLs: `/de`, `/de/privacy`, `/de/impressum`. English URLs unchanged: `/`, `/privacy`, `/impressum`.
- Dependencies are already declared; `npm ci` installs them. No new runtime dependency.
- Copy in German uses formal "Sie" only where the legal text requires it; the CV uses first person as the English does.

## Review Focus

1. A `lang` cookie with any value other than `en` or `de` (empty, tampered) is treated as absent: no crash, no redirect loop. Owned by Task 1.
2. A missing `x-vercel-ip-country` header (local dev) keeps English and does not redirect. Owned by Task 1.
3. A `page` query value outside the allowlist falls back to `/`, so `/language?to=de&page=https://evil.example` cannot redirect off-site. Owned by Task 2.
4. A lowercase country code (`de`) is treated like `DE`. Owned by Task 1.
5. Unknown paths such as `/de/xyz` and `/xx` return the 404 page rather than a blank page or a crash. Owned by Task 4 (English group) and Task 7 (German group), checked in Task 10.

---

### Task 0: Install dependencies and confirm a clean baseline

**Files:** none modified.

- [ ] **Step 1: Install dependencies**

Run: `cd /home/user/my-own-website && npm ci`
Expected: exits 0.

- [ ] **Step 2: Run the existing checks**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass. If anything fails before any change, stop and report it; do not start Task 1.

- [ ] **Step 3: Confirm the Next proxy file convention**

Read `node_modules/next/dist/docs/` for the proxy page (file location and `export function proxy`). If it differs from `src/proxy.ts` / `export function proxy`, update Task 3 before implementing it and tell the user.

---

### Task 1: Pure locale logic

**Files:**
- Create: `src/lib/locale.ts`
- Test: `src/lib/locale.test.ts`

**Interfaces:**
- Produces (exact):
  - `export const LOCALES = ["en", "de"] as const; export type Locale = (typeof LOCALES)[number];`
  - `export const LOCALE_COOKIE = "lang";`
  - `export const SWITCHABLE_PAGES = ["/", "/privacy", "/impressum"] as const; export type SwitchablePage = (typeof SWITCHABLE_PAGES)[number];`
  - `export function parseLocale(value: string | null | undefined): Locale | null`: returns `"en"` or `"de"` exactly, otherwise `null`.
  - `export function localeFromCountry(country: string | null | undefined): Locale`: `"de"` for `DE`, `AT`, `CH`, `LI` in any letter case; `"en"` otherwise, including null.
  - `export function homeRedirect(input: { cookie: string | null | undefined; country: string | null | undefined }): "/de" | null`: a valid cookie decides (`de` → `"/de"`, `en` → `null`). Otherwise (absent or invalid cookie), `localeFromCountry(country) === "de"` → `"/de"`, else `null`.
  - `export function safeSwitchPage(value: string | null | undefined): SwitchablePage`: returns the value if it is in `SWITCHABLE_PAGES`, else `"/"`.
  - `export function localePath(locale: Locale, page: SwitchablePage): string`: `en` → `page`; `de` → `"/de"` for `/`, otherwise `"/de" + page`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { homeRedirect, localeFromCountry, localePath, parseLocale, safeSwitchPage } from "./locale";

describe("parseLocale", () => {
  it("accepts exactly en and de", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe("de");
  });
  it("rejects anything else, so a tampered cookie is treated as absent", () => {
    expect(parseLocale("")).toBeNull();
    expect(parseLocale("DE")).toBeNull();
    expect(parseLocale("fr")).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
  });
});

describe("localeFromCountry", () => {
  it("maps the German-speaking countries to de, in any letter case", () => {
    for (const c of ["DE", "AT", "CH", "LI", "de"]) expect(localeFromCountry(c)).toBe("de");
  });
  it("maps everything else, including a missing header, to en", () => {
    expect(localeFromCountry("US")).toBe("en");
    expect(localeFromCountry(null)).toBe("en");
    expect(localeFromCountry(undefined)).toBe("en");
  });
});

describe("homeRedirect", () => {
  it("sends a German-speaking visitor with no cookie to /de", () => {
    expect(homeRedirect({ cookie: undefined, country: "AT" })).toBe("/de");
  });
  it("leaves other visitors on English", () => {
    expect(homeRedirect({ cookie: undefined, country: "US" })).toBeNull();
    expect(homeRedirect({ cookie: undefined, country: null })).toBeNull();
  });
  it("lets a valid cookie win over the country", () => {
    expect(homeRedirect({ cookie: "en", country: "DE" })).toBeNull();
    expect(homeRedirect({ cookie: "de", country: "US" })).toBe("/de");
  });
  it("treats an invalid cookie as absent", () => {
    expect(homeRedirect({ cookie: "", country: "DE" })).toBe("/de");
    expect(homeRedirect({ cookie: "xx", country: "US" })).toBeNull();
  });
});

describe("safeSwitchPage", () => {
  it("keeps allowed pages", () => {
    expect(safeSwitchPage("/privacy")).toBe("/privacy");
  });
  it("falls back to / for anything else, including off-site URLs", () => {
    expect(safeSwitchPage("https://evil.example")).toBe("/");
    expect(safeSwitchPage("//evil.example")).toBe("/");
    expect(safeSwitchPage(null)).toBe("/");
  });
});

describe("localePath", () => {
  it("maps each page to its German URL", () => {
    expect(localePath("de", "/")).toBe("/de");
    expect(localePath("de", "/privacy")).toBe("/de/privacy");
    expect(localePath("de", "/impressum")).toBe("/de/impressum");
  });
  it("keeps English URLs unchanged", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/privacy")).toBe("/privacy");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/locale.test.ts`
Expected: FAIL, module `./locale` not found.

- [ ] **Step 3: Implement `src/lib/locale.ts`** with the exact exports above. Use a `Set` or `includes` on the constant arrays for the allowlists; country comparison uses `toUpperCase()`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/locale.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/locale.ts src/lib/locale.test.ts
git commit -m "feat: add pure locale decisions for country, cookie and switch targets"
```

---

### Task 2: Language switch route handler

**Files:**
- Create: `src/app/language/route.ts`

**Interfaces:**
- Consumes: `parseLocale`, `safeSwitchPage`, `localePath`, `LOCALE_COOKIE` from Task 1.
- Produces: `GET /language?to=<en|de>&page=<SwitchablePage>` → 307 redirect to `localePath(to, page)` with `Set-Cookie: lang=<to>`. An unknown or missing `to` is treated as `en`.

- [ ] **Step 1: Implement the handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localePath, parseLocale, safeSwitchPage } from "@/lib/locale";

export function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("to")) ?? "en";
  const page = safeSwitchPage(request.nextUrl.searchParams.get("page"));
  const response = NextResponse.redirect(new URL(localePath(locale, page), request.url));
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}
```

- [ ] **Step 2: Verify by build**

Run: `npx tsc --noEmit`
Expected: exits 0. Behaviour is checked end to end in Task 10 (cookie set, redirect target, off-site `page` ignored).

- [ ] **Step 3: Commit**

```bash
git add src/app/language/route.ts
git commit -m "feat: add language switch route that sets the lang cookie and redirects"
```

---

### Task 3: Proxy for the homepage default

**Files:**
- Create: `src/proxy.ts`

**Interfaces:**
- Consumes: `homeRedirect`, `LOCALE_COOKIE` from Task 1.
- Produces: `export function proxy(request: NextRequest)` and `export const config = { matcher: "/" }`.

- [ ] **Step 1: Implement the proxy**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { homeRedirect, LOCALE_COOKIE } from "@/lib/locale";

export function proxy(request: NextRequest) {
  const target = homeRedirect({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    country: request.headers.get("x-vercel-ip-country"),
  });
  if (!target) return NextResponse.next();
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(LOCALE_COOKIE, "de", { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}

export const config = { matcher: "/" };
```

The cookie is set only on redirect, as the spec says. Visitors who are not redirected get no cookie, so their later IP-based decision is unchanged.

- [ ] **Step 2: Verify by build**

Run: `npx tsc --noEmit`
Expected: exits 0. Behaviour is checked in Task 10 (`x-vercel-ip-country: DE` with no cookie lands on `/de`).

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: redirect German-speaking visitors from / to /de once, then remember the choice"
```

---

### Task 4: Move the English site into the `(en)` route group

No visible change. Pure move, so the English site stays identical.

**Files:**
- Move: `src/app/layout.tsx` → `src/app/(en)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(en)/page.tsx`
- Move: `src/app/privacy/page.tsx` → `src/app/(en)/privacy/page.tsx`
- Move: `src/app/impressum/page.tsx` → `src/app/(en)/impressum/page.tsx`
- Move: `src/app/not-found.tsx` → `src/app/(en)/not-found.tsx`
- Create: `src/components/LocaleShell.tsx`
- Keep at app root: `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`, `globals.css` (imported by the layout), `favicon.ico`.

**Interfaces:**
- Produces: `export function LocaleShell({ locale, children }: { locale: Locale; children: ReactNode })`. It renders `<html lang={locale} className=…>` with the `THEME_SCRIPT` head script, `<body>`, the JSON-LD `personJsonLd` script, `SiteControls`, `ReducedMotionNotice`, `Analytics`, `SpeedInsights`, and the three `preload` calls moved from the root layout. The `Inter` font setup moves into this file.

- [ ] **Step 1: Confirm the current build passes before moving**

Run: `npm run build`
Expected: succeeds. Note the route list it prints.

- [ ] **Step 2: Move files with `git mv` so history follows them**

`git mv src/app/page.tsx "src/app/(en)/page.tsx"`, and likewise for the other files listed above. Create `src/app/(en)/layout.tsx` so it keeps the metadata export and renders `<LocaleShell locale="en">{children}</LocaleShell>`. Its props type is `{ children: ReactNode }`; the generated `LayoutProps<"/">` type no longer matches the route group.

- [ ] **Step 3: Fix imports that moved**

`(en)/privacy/page.tsx` and `(en)/impressum/page.tsx` are imported by path only through routing, so no import changes are needed. Check `grep -rn "app/layout\|app/page" src` returns nothing.

- [ ] **Step 4: Verify the English site is unchanged**

Run: `npm run build && npm test && npm run e2e`
Expected: all pass; the build route list shows `/`, `/privacy`, `/impressum`, and `/_not-found` as before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move the English site into an (en) route group behind a shared LocaleShell"
```

---

### Task 5: German CV content with a typed parity test

**Files:**
- Rename: `src/content/cv.ts` → `src/content/cv.en.ts` (`export const cvEn: CV`)
- Create: `src/content/cv.de.ts` (`export const cvDe: CV`)
- Create: `src/content/cv.parity.test.ts`
- Create: `src/content/index.ts` with `export function getCv(locale: Locale): CV`
- Modify: `src/app/(en)/page.tsx` and any import of `@/content/cv` to use `getCv("en")`.

**Interfaces:**
- Consumes: `CV` from `src/content/types.ts`; `Locale` from Task 1.
- Produces: `getCv(locale: Locale): CV`.

- [ ] **Step 1: Write the failing parity test**

```ts
import { describe, expect, it } from "vitest";
import { cvDe } from "./cv.de";
import { cvEn } from "./cv.en";

describe("cvDe mirrors cvEn", () => {
  it("has the same shape: same array lengths, same skill items, same link fields", () => {
    expect(cvDe.experience.map((e) => e.highlights.length)).toEqual(cvEn.experience.map((e) => e.highlights.length));
    expect(cvDe.experience.map((e) => e.tags.length)).toEqual(cvEn.experience.map((e) => e.tags.length));
    expect(cvDe.education.length).toBe(cvEn.education.length);
    expect(cvDe.skills.map((g) => g.group)).toEqual(cvEn.skills.map((g) => g.group));
    expect(cvDe.skills.map((g) => g.items.map((i) => i.level))).toEqual(cvEn.skills.map((g) => g.items.map((i) => i.level)));
    expect(cvDe.next.steps.map((s) => s.label)).toEqual(cvEn.next.steps.map((s) => s.label));
  });
  it("keeps the values that are not prose: dates, links, email, name", () => {
    expect(cvDe.profile.links).toEqual(cvEn.profile.links);
    expect(cvDe.profile.name).toBe(cvEn.profile.name);
    expect(cvDe.experience.map((e) => [e.start, e.end])).toEqual(cvEn.experience.map((e) => [e.start, e.end]));
  });
});
```

Skill names and tool names (`C++`, `Python`, `Git`, `Claude Code`, `Cursor`) stay the same in German.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/cv.parity.test.ts`
Expected: FAIL, `./cv.de` not found.

- [ ] **Step 3: Create `cv.de.ts`**

Translate every prose field of `cvEn` (summary, roles, highlights, notes, `agentic`, `next`, `additional`, skill group names in `types.ts` are kept as English identifiers, but the group *display* is translated in the UI dictionary in Task 6). Keep the same array lengths and order, and copy the dates, links and email unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/content/cv.parity.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `getCv` and switch the English page to it**

`src/content/index.ts`: `export function getCv(locale: Locale): CV { return locale === "de" ? cvDe : cvEn; }`. Run `npx tsc --noEmit`; expect exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add German CV content with a parity test against the English CV"
```

---

### Task 6: UI dictionary and threading it through components

**Files:**
- Create: `src/i18n/en.ts` (`export const en = { … } as const`)
- Create: `src/i18n/de.ts` (`export const de = { … } satisfies typeof en`)
- Create: `src/i18n/index.ts` with `export function getDictionary(locale: Locale): Dictionary` where `type Dictionary = typeof en`.
- Create: `src/i18n/dictionaries.test.ts`
- Modify: every section and UI component that renders fixed copy (see Step 1).

**Interfaces:**
- Produces: `Dictionary` (type), `getDictionary(locale)`.
- Consumes: `Locale` from Task 1.

- [ ] **Step 1: Inventory the fixed copy**

Run: `grep -rn ">[A-Za-z][^<{]*<\|aria-label=\"\|title=\"\|alt=\"\|placeholder=\"" src/components src/app --include=*.tsx | grep -v test`
List each string in the output as a dictionary key. Include: section headings, button labels, `aria-label`s, `alt` text, the `ReducedMotionNotice` text, `ExperienceGate` text, and the 404 page. Labels in the 3D scenes are handled in Task 9.

- [ ] **Step 2: Write the parity test**

```ts
import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("de dictionary", () => {
  it("has every key of en and no extra key", () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });
  it("has no empty German value", () => {
    for (const k of keys(de)) {
      const value = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], de);
      expect(value, k).toBeTruthy();
    }
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/i18n/dictionaries.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Create `en.ts` from the inventory, `de.ts` with German values**

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/i18n/dictionaries.test.ts`
Expected: PASS.

- [ ] **Step 6: Thread `dict` through the components**

Each section component gets a `dict: Dictionary` prop instead of reading English literals. `Sections` in `src/components/StaticPage.tsx` takes `locale` and passes `dict` and `getCv(locale)` down. The English group passes `"en"` (through `(en)/page.tsx`). Do not change any rendered English text, so the English site stays identical.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm test && npm run e2e`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add a typed UI dictionary and pass it through the page components"
```

---

### Task 7: German route group with pages, metadata and alternates

**Files:**
- Create: `src/app/(de)/layout.tsx` (German metadata, `<LocaleShell locale="de">`)
- Create: `src/app/(de)/de/page.tsx`
- Create: `src/app/(de)/de/privacy/page.tsx`
- Create: `src/app/(de)/de/impressum/page.tsx`
- Create: `src/app/(de)/not-found.tsx`
- Modify: `src/app/(en)/layout.tsx` and `src/app/(en)/*/page.tsx` to add `alternates.languages`.
- Modify: `src/app/sitemap.ts` to list `/`, `/de`, `/privacy`, `/de/privacy`, `/impressum`, `/de/impressum`.

**Interfaces:**
- Consumes: `getCv`, `getDictionary`, `Locale`, `localePath`.
- Produces: pages at `/de`, `/de/privacy`, `/de/impressum`.

- [ ] **Step 1: Write the failing test for alternates**

Add to `src/lib/locale.test.ts`:
```ts
import { alternatesFor } from "./locale";
it("lists both language URLs for a page", () => {
  expect(alternatesFor("/")).toEqual({ en: "/", de: "/de" });
  expect(alternatesFor("/privacy")).toEqual({ en: "/privacy", de: "/de/privacy" });
});
```
Add `export function alternatesFor(page: SwitchablePage): Record<Locale, string>` that returns `{ en: page, de: localePath("de", page) }`.

- [ ] **Step 2: Run to verify failure, implement, run to verify pass**

Run: `npx vitest run src/lib/locale.test.ts`
Expected: FAIL, then PASS after adding `alternatesFor`.

- [ ] **Step 3: Build the German pages**

Each `(de)/de/*` page mirrors its English page and calls `getCv("de")`, `getDictionary("de")`. Metadata uses the German title and description (from `cvDe.profile.summary`), `openGraph.locale: "de_DE"`, `alternates: { canonical, languages: alternatesFor(page) }`. The English metadata gets `openGraph.locale: "en_US"` and the same `alternates`.

- [ ] **Step 4: Write the German privacy and impressum text**

Translate the content of `src/app/(en)/privacy/page.tsx` and `src/app/(en)/impressum/page.tsx` (and `LegalPage` if it holds copy). The German impressum follows the German legal requirement for this page: it names the same responsible person and address as the English one, with the wording a German site uses.

- [ ] **Step 5: Verify the build and the routes**

Run: `npm run build`
Expected: succeeds; the route list contains `/de`, `/de/privacy`, `/de/impressum`, and the German `not-found`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add the German site at /de with localized metadata and alternates"
```

---

### Task 8: Language switch button in the control capsule

**Files:**
- Modify: `src/components/SiteControls.tsx` (add `locale` and `page` props, the switch link)
- Create: `src/components/LanguageSwitch.tsx`
- Create: `src/components/LanguageSwitch.test.tsx`
- Modify: `src/components/SiteControls.tsx` callers: the English and German layouts pass `locale` and the current `page`.

**Interfaces:**
- Consumes: `localePath`, `SwitchablePage`, `Locale`, `getDictionary`.
- Produces: `export function LanguageSwitch({ locale, page, className }: { locale: Locale; page: SwitchablePage; className: string })`.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageSwitch } from "./LanguageSwitch";

describe("LanguageSwitch", () => {
  it("on English, offers German for the same page", () => {
    render(<LanguageSwitch locale="en" page="/privacy" className="" />);
    const link = screen.getByRole("link", { name: /deutsch/i });
    expect(link.getAttribute("href")).toBe("/language?to=de&page=%2Fprivacy");
    expect(link.textContent).toBe("DE");
  });
  it("on German, offers English for the same page", () => {
    render(<LanguageSwitch locale="de" page="/" className="" />);
    const link = screen.getByRole("link", { name: /english/i });
    expect(link.getAttribute("href")).toBe("/language?to=en&page=%2F");
    expect(link.textContent).toBe("EN");
  });
});
```

Note: the accessible names are "Deutsch" and "English" as shown; use the dictionary's `languageSwitch.label` for the German name and `en.languageSwitch.label` for English when Task 6 is done. Until then, the test uses the literal names above.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/LanguageSwitch.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `LanguageSwitch`**

A plain `<Link>` to `/language?to=<other>&page=<encodeURIComponent(page)>`. It shows `DE` or `EN` as text, with `aria-label` and `title` set to the dictionary label ("Auf Deutsch wechseln" / "Switch to English"). It uses the same `BUTTON`-style classes as `ThemeToggle`, passed in through `className`. Keep the focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`.

- [ ] **Step 4: Place it in `SiteControls`**

Render `<LanguageSwitch>` between the home link and `<ThemeToggle>`. The home link's `href` becomes `localePath(locale, "/")`, so `/de` links to `/de#hero`. The fold-away rule on `data-page=hero` still applies to the home link only.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/components/LanguageSwitch.test.tsx && npx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add a DE/EN switch to the top-right control capsule"
```

---

### Task 9: 3D landing page labels in German

**Files:**
- Modify: `src/components/ExperienceGate.tsx` (`ExperienceProps` gains `locale: Locale` and `dict: Dictionary`)
- Modify: `src/components/three/Experience3D.tsx` and the station files that draw text (`src/components/three/stations/*.tsx`) that take the dictionary through props.

**Interfaces:**
- Consumes: `Locale`, `Dictionary`, `getDictionary`.
- Produces: `ExperienceProps` with `locale` and `dict`.

- [ ] **Step 1: Inventory the 3D text**

Run: `grep -rn "text\|label\|title" src/components/three --include=*.tsx | grep -v test`
List every visible string. Scene geometry, colours and motion are not text and are not changed.

- [ ] **Step 2: Add the dictionary keys for the 3D text**

Add them to `en.ts` and `de.ts`. Run `npx vitest run src/i18n/dictionaries.test.ts`; expect PASS.

- [ ] **Step 3: Pass `locale` and `dict` through `ExperienceGate`**

`ExperienceGate` receives them from the page and forwards them to `Experience3D`. Update `ExperienceGate.test.tsx` fixtures to include the new props.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: localize the 3D landing page labels"
```

---

### Task 10: Redirect, switch and 404 checks in a browser, plus the screenshot

**Files:**
- Modify: `e2e/smoke.spec.ts` (add cases) or create `e2e/locale.spec.ts`.

- [ ] **Step 1: Write the e2e cases**

```ts
import { expect, test } from "@playwright/test";

test("German visitor on / is sent to /de and the cookie is set", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "DE" }, maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(/\/de$/);
  expect(res.headers()["set-cookie"]).toContain("lang=de");
});

test("visitor from elsewhere stays on English", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "US" }, maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("a lang=en cookie beats a German IP", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "DE", cookie: "lang=en" }, maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("switch link on /privacy goes to /de/privacy and sets the cookie", async ({ request }) => {
  const res = await request.get("/language?to=de&page=/privacy", { maxRedirects: 0 });
  expect(res.headers()["location"]).toMatch(/\/de\/privacy$/);
  expect(res.headers()["set-cookie"]).toContain("lang=de");
});

test("an off-site page parameter is ignored", async ({ request }) => {
  const res = await request.get("/language?to=en&page=https://evil.example", { maxRedirects: 0 });
  expect(res.headers()["location"]).toMatch(/\/$/);
  expect(res.headers()["location"]).not.toContain("evil.example");
});

test("unknown German path returns 404", async ({ request }) => {
  const res = await request.get("/de/xyz");
  expect(res.status()).toBe(404);
});
```

- [ ] **Step 2: Run the e2e suite**

Run: `npm run e2e`
Expected: all pass. If the proxy test fails with 200 on a German IP, check the matcher in `src/proxy.ts`.

- [ ] **Step 3: Take the screenshots**

Start `npm run start` (after `npm run build`) and use Playwright (the pre-installed Chromium at `/opt/pw-browsers/chromium`, launch with `--no-sandbox`) to capture the top-right capsule at `/de` in light and dark mode, at desktop width (1280×800) and phone width (390×844). Save the screenshots in the scratchpad directory, and send the desktop light one to the user.

- [ ] **Step 4: Full verification**

Run: `npm run lint && npx tsc --noEmit && npm test && npm run e2e && npm run build`
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: cover the locale redirect, switch and 404 behaviour end to end"
```

---

## Notes for the implementer

- Next's generated `LayoutProps` / `PageProps` types depend on the route. Adjust layout and page prop types to the route group; do not hand-write types the build generates.
- Keep `(en)` output byte-identical until Task 6 changes copy source only, not rendered English text.
- If `cacheComponents` rejects a page, do not add `dynamic`; report it, since the spec relies on static pages.
