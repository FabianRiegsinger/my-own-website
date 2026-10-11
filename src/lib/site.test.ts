import { describe, it, expect } from "vitest";
import { siteUrl } from "./site";

describe("siteUrl", () => {
  it("prefers the explicit env var", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://fabian.dev", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://fabian.dev");
  });
  it("falls back to the Vercel production domain", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "my-own-website.vercel.app" })).toBe("https://my-own-website.vercel.app");
  });
  it("uses localhost only when nothing is set", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
