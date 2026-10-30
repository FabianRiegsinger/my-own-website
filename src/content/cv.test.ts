import { describe, it, expect } from "vitest";
import { cvEn as cv } from "./cv.en";
import { JOB_STATIONS } from "@/lib/scroll-map";

function strings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === "object") return Object.values(v).flatMap(strings);
  return [];
}

const levels = (group: string) =>
  Object.fromEntries(cv.skills.find((g) => g.group === group)!.items.map((i) => [i.name, i.level]));

describe("cv", () => {
  it("experience is newest first", () => {
    expect(cv.experience[0].company).toBe("Mobileye Germany GmbH");
    expect(cv.experience[0].end).toBeNull();
    expect(cv.experience[1].start).toBe("2018-07");
    expect(cv.experience[1].end).toBe("2024-11");
  });

  it("skill levels match spec", () => {
    expect(levels("Languages")).toEqual({ "C++": 3, Python: 4, "JavaScript/React": 3, "HTML/CSS": 2 });
    expect(levels("Automotive")["ADAS/AD integration"]).toBe(5);
    expect(levels("AI")["Claude Code"]).toBe(4);
  });

  it("no empty strings", () => {
    for (const s of strings(cv)) expect(s.trim().length).toBeGreaterThan(0);
  });

  it("no phone number", () => {
    expect(JSON.stringify(cv)).not.toMatch(/\+?49[\s\d]{6,}/);
  });

  it("agentic tools", () => {
    expect(cv.agentic.tools).toEqual(["Claude Code", "Cursor", "VS Code"]);
  });

  it("every job has its own career page", () => {
    expect(cv.experience).toHaveLength(JOB_STATIONS.length);
  });
});
