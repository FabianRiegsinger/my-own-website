# German localization with `/de` routes: design

Date: 2026-10-30
Status: draft, awaiting review

## Goal

Make the whole site available in German next to English, with a language switch in the top-right control capsule and an automatic default for visitors from German-speaking countries.

## Decisions

| Topic | Decision |
|---|---|
| URL scheme | English stays at `/`. German lives at `/de`, `/de/privacy`, `/de/impressum`. |
| Automatic default | On `/` with no `lang` cookie, a visitor whose `x-vercel-ip-country` is DE, AT, CH or LI is redirected to `/de` and the cookie is set. |
| Remembered choice | The `lang` cookie (`en` or `de`) is written on every language change, by the switch or by the redirect. A cookie always wins over the IP. |
| Scope | CV content, all UI labels, 3D landing page labels, privacy and impressum pages. GitHub project descriptions stay English. |
| Content model | Two typed CV objects (`cv.en.ts`, `cv.de.ts`) sharing the `CV` interface. UI strings in a typed dictionary. No i18n library. |
| Switch | A second round button in `SiteControls`, beside the theme toggle. It is a plain link to the same page in the other language, so it works without JavaScript. |

## Architecture

### Routing

- `src/app/layout.tsx` stays the root layout and renders the `<html>` element. `lang` is set from the locale, which requires moving the `<html>` and `<body>` into a per-locale layout, `src/app/[locale]/layout.tsx`, or setting it from a locale context. Implementation plan decides which, after checking the Next 16 docs for `params` handling.
- Pages move to `src/app/[locale]/page.tsx`, `src/app/[locale]/privacy/page.tsx`, `src/app/[locale]/impressum/page.tsx`. `locale` is `en` or `de`, validated by `generateStaticParams` and a `notFound()` fallback.
- A proxy file (Next 16 convention; the exact filename and API are confirmed in `node_modules/next/dist/docs/` before implementation) handles:
  1. Redirect `/` to `/de` when there is no `lang` cookie and the country header is a German-speaking one.
  2. Set the `lang` cookie on that redirect.
- Requests that already carry a `lang` cookie are never redirected by country.
- The redirect is conditional, so `/` and `/de` are rendered per request instead of prerendered. Load time is measured before and after; if the regression is significant, the design is revisited before merge.

### Content

- `src/content/types.ts` keeps `CV` as the shared shape.
- `src/content/cv.en.ts` contains the current `cv.ts` content unchanged. `src/content/cv.de.ts` is a German translation of every field.
- `src/content/cv.ts` is removed. A helper `getCv(locale)` returns the right object.
- `project-overrides.ts` and the GitHub fetch are unchanged.

### UI strings

- `src/i18n/en.ts` and `src/i18n/de.ts` export one object with the same keys. `de.ts` is typed `satisfies typeof en`, so a missing key is a compile error.
- Section components receive `t` (the dictionary) through props from the page, not through a global, to keep them testable.

### Switch button

- `SiteControls` receives `locale` and renders a button between the home link and the theme toggle, labelled `DE` or `EN`. Its `href` is the same page in the other locale (`/` ↔ `/de`, `/privacy` ↔ `/de/privacy`, and so on).
- Clicking it sets the `lang` cookie through a server action or the proxy on the next request, then follows the link.
- The button uses the existing `BUTTON` classes and focus ring, and has a translated `aria-label` and `title`.

### Metadata and SEO

- `<html lang>` follows the locale.
- `metadata.alternates.languages` gives `en` and `de` links on both pages, so search engines can match them.
- Open Graph `locale` is `en_US` or `de_DE`. The JSON-LD `Person` object uses the locale's headline and summary.

### 3D landing page

- Text the 3D scenes draw (labels, station titles) takes the dictionary entry from the `locale` prop passed through `ExperienceGate` to `Experience3D`. Scene code that only draws shapes is unchanged.

## Testing

- Unit: the country-to-locale decision (`DE`, `AT`, `CH`, `LI` map to `de`, other or missing country to `en`, existing cookie always wins).
- Unit: the cookie parse and write helpers.
- Unit: `de.ts` has every key of `en.ts`, and `cv.de.ts` has every field of `cv.en.ts` (structural comparison of keys and array lengths).
- Unit: `SiteControls` shows the correct switch target for each locale.
- E2E (Playwright): `/` and `/de` both render; the switch navigates between them; a request with `x-vercel-ip-country: DE` and no cookie lands on `/de`.
- Manual: screenshot of the switch in the header, in light and dark mode, desktop and phone width.

## Out of scope

- Translating GitHub project descriptions.
- Locales beyond English and German.
- Machine-translated fallback text. Every visible string has a German value.

## Open items for the implementation plan

- Exact proxy filename and API in Next 16, confirmed from the installed docs.
- Whether `[locale]` segment or context is used for `lang` (see Routing).
- Performance measurement method for the per-request render of `/`.
