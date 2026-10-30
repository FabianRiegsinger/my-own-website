import type { Locale } from "@/lib/locale";
import { de } from "./de";
import { en, type Dictionary } from "./en";

export type { Dictionary } from "./en";

export function getDictionary(locale: Locale): Dictionary {
  return locale === "de" ? de : en;
}
