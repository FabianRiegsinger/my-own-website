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
  ...o,
});

describe("selectProjects", () => {
  it("keeps every public repo, excludes forks, private and archived", () => {
    const out = selectProjects(
      [
        repo({ name: "a" }),
        repo({ name: "b" }),
        repo({ name: "fork", fork: true }),
        repo({ name: "priv", private: true }),
        repo({ name: "old", archived: true }),
      ],
      [],
    );
    expect(out.map((p) => p.name).sort()).toEqual(["a", "b"]);
  });

  it("handles null description, empty homepage", () => {
    const out = selectProjects([repo({ name: "a", description: null, homepage: "" })], []);
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

  it("sorts by stars, then alphabetically", () => {
    const out = selectProjects(
      [
        repo({ name: "zeta", stargazers_count: 0 }),
        repo({ name: "Beta", stargazers_count: 2 }),
        repo({ name: "alpha", stargazers_count: 2 }),
        repo({ name: "top", stargazers_count: 10 }),
        repo({ name: "gamma", stargazers_count: 0 }),
      ],
      [],
    );
    expect(out.map((p) => p.name)).toEqual(["top", "alpha", "Beta", "gamma", "zeta"]);
  });
});

describe("getProjects", () => {
  it("falls back to overrides on 403", async () => {
    const f = (async () => new Response("rate limited", { status: 403 })) as typeof fetch;
    expect((await getProjects(f)).map((p) => p.name)).toEqual(["lime", "snap-notes"]);
  });

  it("falls back to overrides when no public repo is returned", async () => {
    const f = (async () => Response.json([repo({ name: "x", fork: true })])) as typeof fetch;
    expect((await getProjects(f)).map((p) => p.name)).toEqual(["lime", "snap-notes"]);
  });

  it("falls back to overrides on network error", async () => {
    const f = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const out = await getProjects(f);
    expect(out.map((p) => p.name)).toEqual(["lime", "snap-notes"]);
    expect(out[0].url).toBe("https://github.com/FabianRiegsinger/lime");
  });

  it("sends GITHUB_TOKEN when set, to avoid shared-IP rate limits", async () => {
    let auth: string | null = "unset";
    const f = (async (_url: string, init?: RequestInit) => {
      auth = new Headers(init?.headers).get("Authorization");
      return Response.json([repo({ name: "snap-notes" })]);
    }) as typeof fetch;
    await getProjects(f, "tok123");
    expect(auth).toBe("Bearer tok123");
    await getProjects(f, undefined);
    expect(auth).toBeNull();
  });
});
