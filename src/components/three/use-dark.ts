import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const o = new MutationObserver(onChange);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
};

/** Whether the page is in dark mode (`data-theme` on <html>, see lib/theme), re-rendering when it is switched. */
export const useDark = () => useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);
