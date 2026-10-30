import type { Dictionary } from "@/i18n";

/** "2024-12" → "Dec 2024" (or "Dez 2024"); null → "Present" (or "heute") */
export function formatMonth(ym: string | null, t: Dictionary["timeline"]): string {
  if (!ym) return t.present;
  const [y, m] = ym.split("-");
  return `${t.months[Number(m) - 1]} ${y}`;
}
