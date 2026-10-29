// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_KEY, toggleTheme } from "./theme";

const systemDark = (dark: boolean) => vi.stubGlobal("matchMedia", () => ({ matches: dark }));

describe("toggleTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("flips the theme and stores a choice that differs from the system", () => {
    systemDark(false);
    document.documentElement.dataset.theme = "light";
    toggleTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("clears the stored choice when flipping back to the system's theme", () => {
    systemDark(false);
    localStorage.setItem(THEME_KEY, "dark");
    document.documentElement.dataset.theme = "dark";
    toggleTheme();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });
});
