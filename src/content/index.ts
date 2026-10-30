import type { Locale } from "@/lib/locale";
import { cvDe } from "./cv.de";
import { cvEn } from "./cv.en";
import type { CV } from "./types";

export function getCv(locale: Locale): CV {
  return locale === "de" ? cvDe : cvEn;
}
