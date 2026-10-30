export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "lang";

export const SWITCHABLE_PAGES = ["/", "/privacy", "/impressum"] as const;
export type SwitchablePage = (typeof SWITCHABLE_PAGES)[number];

const GERMAN_COUNTRIES = ["DE", "AT", "CH", "LI"];

/** Exact match only: anything else (empty, tampered, uppercase) counts as no locale. */
export function parseLocale(value: string | null | undefined): Locale | null {
  return LOCALES.find((locale) => locale === value) ?? null;
}

export function localeFromCountry(country: string | null | undefined): Locale {
  return country && GERMAN_COUNTRIES.includes(country.toUpperCase()) ? "de" : "en";
}

/** A valid cookie decides; without one, the visitor's country decides. Returns the URL to redirect to, or null. */
export function homeRedirect(input: { cookie: string | null | undefined; country: string | null | undefined }): "/de" | null {
  const locale = parseLocale(input.cookie) ?? localeFromCountry(input.country);
  return locale === "de" ? "/de" : null;
}

export function safeSwitchPage(value: string | null | undefined): SwitchablePage {
  return SWITCHABLE_PAGES.find((page) => page === value) ?? "/";
}

export function localePath(locale: Locale, page: SwitchablePage): string {
  if (locale === "en") return page;
  return page === "/" ? "/de" : `/de${page}`;
}
