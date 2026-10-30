import { getDictionary } from "@/i18n";
import { type Locale, type SwitchablePage } from "@/lib/locale";

/** Shows the other language's code and links to the same page in it, through /language (a plain link: works without JavaScript). */
export function LanguageSwitch({ locale, page, className }: { locale: Locale; page: SwitchablePage; className: string }) {
  const t = getDictionary(locale);
  const other: Locale = locale === "en" ? "de" : "en";
  const href = `/language?${new URLSearchParams({ to: other, page }).toString()}`;
  return (
    <a
      href={href}
      aria-label={t.nav.switch.label}
      title={t.nav.switch.label}
      className={`grid cursor-pointer place-items-center text-sm font-semibold text-ink transition-all duration-300 hover:bg-surface/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${className}`}
    >
      {t.nav.switch.short}
    </a>
  );
}
