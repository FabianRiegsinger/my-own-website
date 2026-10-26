import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const o = new MutationObserver(onChange);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
};

/** Whether the page is in dark mode (`data-theme` on <html>, see lib/theme), re-rendering when it is switched. */
export const useDark = () => useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);

/**
 * Dark-mode greys for the scenery: walls and floors fade out at their edges into the page, so in dark mode they take a
 * shade just above the page's near-black (--bg) and the fade melts into it instead of leaving a pale glowing panel.
 */
export const DARK = { wall: "#2b2e35", floor: "#24272d", trim: "#4a4e57", tint: "#5d616c" };
