import { describe, expect, it } from "vitest";
import { cvDe } from "./cv.de";
import { cvEn } from "./cv.en";

describe("cvDe mirrors cvEn", () => {
  it("has the same shape: same array lengths, same skill items, same link fields", () => {
    expect(cvDe.experience.map((e) => e.highlights.length)).toEqual(cvEn.experience.map((e) => e.highlights.length));
    expect(cvDe.experience.map((e) => e.tags.length)).toEqual(cvEn.experience.map((e) => e.tags.length));
    expect(cvDe.education.length).toBe(cvEn.education.length);
    expect(cvDe.skills.map((g) => g.group)).toEqual(cvEn.skills.map((g) => g.group));
    expect(cvDe.skills.map((g) => g.items.map((i) => i.level))).toEqual(cvEn.skills.map((g) => g.items.map((i) => i.level)));
    expect(cvDe.next.steps.map((s) => s.label)).toEqual(cvEn.next.steps.map((s) => s.label));
  });
  it("keeps the values that are not prose: dates, links, email, name", () => {
    expect(cvDe.profile.links).toEqual(cvEn.profile.links);
    expect(cvDe.profile.name).toBe(cvEn.profile.name);
    expect(cvDe.experience.map((e) => [e.start, e.end])).toEqual(cvEn.experience.map((e) => [e.start, e.end]));
  });
});
