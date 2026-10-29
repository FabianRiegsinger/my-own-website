/** localStorage key for a theme picked with the toggle; absent = follow the system. */
export const THEME_KEY = "theme";

/**
 * Runs inline in <head> before first paint (no flash of the wrong theme): sets `data-theme` on <html> from the stored
 * choice, else the system's, and keeps following the system while nothing is stored.
 */
export const THEME_SCRIPT = `(function(){var k=${JSON.stringify(THEME_KEY)},m=matchMedia("(prefers-color-scheme: dark)"),s=function(){var t;try{t=localStorage.getItem(k)}catch(e){}document.documentElement.dataset.theme=t||(m.matches?"dark":"light")};s();m.addEventListener("change",s)})()`;

/** Flips the theme. Picking what the system already shows clears the stored choice, so the system leads again. */
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const system = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  try {
    if (next === system) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {}
  document.documentElement.dataset.theme = next;
}
