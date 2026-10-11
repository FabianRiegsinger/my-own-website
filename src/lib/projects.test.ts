import { describe, it, expect } from "vitest";
import { selectProjects, getProjects, type GitHubRepo } from "./projects";

const repo = (o: Partial<GitHubRepo>): GitHubRepo => ({
  name: "r",
  description: "d",
  language: "Rust",
  stargazers_count: 1,
  html_url: "https://github.com/x/r",
  homepage: null,
  pushed_at: "2026-01-01T00:00:00Z",
  fork: false,
  private: false,
  topics: ["portfolio"],
  ...o,
});

describe("selectProjects", () => {
  it("filters by portfolio topic, excludes forks and private", () => {
    const out = selectProjects(
      [
        repo({ name: "tagged" }),
        repo({ name: "untagged", topics: [] }),
        repo({ name: "fork", fork: true }),
        repo({ name: "priv", private: true }),
      ],
      [],
    );
    expect(out.map((p) => p.name)).toEqual(["tagged"]);
  });

  it("handles null description, missing topics, empty homepage", () => {
    const out = selectProjects(
      [repo({ name: "a", description: null, homepage: "" }), repo({ name: "b", topics: undefined })],
      [],
    );
    expect(out).toHaveLength(1);
    expect(out[0].description).toBe("");
    expect(out[0].homepage).toBeNull();
  });

  it("override wins per field", () => {
    const out = selectProjects([repo({ name: "a" })], [{ name: "a", description: "better", tagline: "t" }]);
    expect(out[0].description).toBe("better");
    expect(out[0].tagline).toBe("t");
    expect(out[0].language).toBe("Rust");
  });

  it("sorts newest first", () => {
    const out = selectProjects(
      [repo({ name: "old", pushed_at: "2025-01-01T00:00:00Z" }), repo({ name: "new", pushed_at: "2026-05-01T00:00:00Z" })],
      [],
    );
    expect(out.map((p) => p.name)).toEqual(["new", "old"]);
  });
});

describe("getProjects", () => {
  it("falls back to overrides on 403", async () => {
    const f = (async () => new Response("rate limited", { status: 403 })) as typeof fetch;
    expect((await getProjects(f)).map((p) => p.name)).toEqual(["snap-notes"]);
  });

  it("falls back to overrides when no repo is tagged", async () => {
    const f = (async () => Response.json([repo({ name: "x", topics: [] })])) as typeof fetch;
    expect((await getProjects(f)).map((p) => p.name)).toEqual(["snap-notes"]);
  });

  it("falls back to overrides on network error", async () => {
    const f = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const out = await getProjects(f);
    expect(out.map((p) => p.name)).toEqual(["snap-notes"]);
    expect(out[0].url).toBe("https://github.com/FabianRiegsinger/snap-notes");
  });
});
