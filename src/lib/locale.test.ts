import { describe, expect, it } from "vitest";
import { alternatesFor, homeRedirect, localeFromCountry, localePath, pageFromPath, parseLocale, safeSwitchPage } from "./locale";

describe("parseLocale", () => {
  it("accepts exactly en and de", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe("de");
  });
  it("rejects anything else, so a tampered cookie is treated as absent", () => {
    expect(parseLocale("")).toBeNull();
    expect(parseLocale("DE")).toBeNull();
    expect(parseLocale("fr")).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
  });
});

describe("localeFromCountry", () => {
  it("maps the German-speaking countries to de, in any letter case", () => {
    for (const c of ["DE", "AT", "CH", "LI", "de"]) expect(localeFromCountry(c)).toBe("de");
  });
  it("maps everything else, including a missing header, to en", () => {
    expect(localeFromCountry("US")).toBe("en");
    expect(localeFromCountry(null)).toBe("en");
    expect(localeFromCountry(undefined)).toBe("en");
  });
});

describe("homeRedirect", () => {
  it("sends a German-speaking visitor with no cookie to /de", () => {
    expect(homeRedirect({ cookie: undefined, country: "AT" })).toBe("/de");
  });
  it("leaves other visitors on English", () => {
    expect(homeRedirect({ cookie: undefined, country: "US" })).toBeNull();
    expect(homeRedirect({ cookie: undefined, country: null })).toBeNull();
  });
  it("lets a valid cookie win over the country", () => {
    expect(homeRedirect({ cookie: "en", country: "DE" })).toBeNull();
    expect(homeRedirect({ cookie: "de", country: "US" })).toBe("/de");
  });
  it("treats an invalid cookie as absent", () => {
    expect(homeRedirect({ cookie: "", country: "DE" })).toBe("/de");
    expect(homeRedirect({ cookie: "xx", country: "US" })).toBeNull();
  });
});

describe("safeSwitchPage", () => {
  it("keeps allowed pages", () => {
    expect(safeSwitchPage("/privacy")).toBe("/privacy");
  });
  it("falls back to / for anything else, including off-site URLs", () => {
    expect(safeSwitchPage("https://evil.example")).toBe("/");
    expect(safeSwitchPage("//evil.example")).toBe("/");
    expect(safeSwitchPage(null)).toBe("/");
  });
});

describe("localePath", () => {
  it("maps each page to its German URL", () => {
    expect(localePath("de", "/")).toBe("/de");
    expect(localePath("de", "/privacy")).toBe("/de/privacy");
    expect(localePath("de", "/impressum")).toBe("/de/impressum");
  });
  it("keeps English URLs unchanged", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/privacy")).toBe("/privacy");
  });
});

describe("alternatesFor", () => {
  it("lists both language URLs for a page", () => {
    expect(alternatesFor("/")).toEqual({ en: "/", de: "/de" });
    expect(alternatesFor("/privacy")).toEqual({ en: "/privacy", de: "/de/privacy" });
  });
});

describe("pageFromPath", () => {
  it("maps German URLs back to their switchable page", () => {
    expect(pageFromPath("/de")).toBe("/");
    expect(pageFromPath("/de/privacy")).toBe("/privacy");
    expect(pageFromPath("/de/impressum")).toBe("/impressum");
  });
  it("keeps English URLs and falls back to / for anything unknown", () => {
    expect(pageFromPath("/")).toBe("/");
    expect(pageFromPath("/impressum")).toBe("/impressum");
    expect(pageFromPath("/de/xyz")).toBe("/");
  });
});
