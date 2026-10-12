import { describe, it, expect } from "vitest";
import { STATIONS, stationAt, localProgress, toStationOffset, stationWeight, heading, careerWeight, careerTravel } from "./scroll-map";

const st = (id: string) => STATIONS.find((s) => s.id === id)!;
const mid = (id: string) => (st(id).start + st(id).end) / 2;

describe("scroll-map", () => {
  it("has one station per page, in page order", () => {
    expect(STATIONS.map((s) => s.id)).toEqual(["hero", "about", "education", "esas", "mobileye", "skills", "agentic", "contact"]);
  });

  it("ranges are contiguous and cover 0..1", () => {
    expect(STATIONS[0].start).toBe(0);
    expect(STATIONS.at(-1)!.end).toBe(1);
    STATIONS.slice(0, -1).forEach((s, i) => expect(s.end).toBe(STATIONS[i + 1].start));
  });

  it("clamps out-of-range offsets and includes both ends", () => {
    expect(stationAt(0).id).toBe("hero");
    expect(stationAt(1).id).toBe("contact");
    expect(stationAt(-0.5).id).toBe("hero");
    expect(stationAt(1.5).id).toBe("contact");
  });

  it("every career page walks", () => {
    for (const id of ["education", "esas", "mobileye"]) expect(stationAt(mid(id)).clip).toBe("walk");
  });

  it("local progress is relative to the station", () => {
    expect(localProgress(mid("esas"))).toBeCloseTo(0.5);
  });

  it("maps a scroll position inside a measured section onto its station range", () => {
    const sections = STATIONS.map((_, i) => ({ top: i * 1000, height: 1000 }));
    expect(toStationOffset(3500, sections)).toBeCloseTo(mid("esas"));
    expect(toStationOffset(-10, sections)).toBe(0);
    expect(toStationOffset(99999, sections)).toBe(1);
  });

  it("returns 0 when sections are not measured yet", () => {
    expect(toStationOffset(500, [])).toBe(0);
  });

  it("station weight is 1 inside its range and fades to 0 outside", () => {
    expect(stationWeight(mid("skills"), "skills")).toBe(1);
    expect(stationWeight(0, "skills")).toBe(0);
    expect(stationWeight(st("skills").start - 0.025, "skills")).toBeCloseTo(0.5);
    expect(stationWeight(1, "contact")).toBe(1);
  });

  it("career weight spans education through mobileye", () => {
    expect(careerWeight(mid("education"))).toBe(1);
    expect(careerWeight(mid("mobileye"))).toBe(1);
    expect(careerWeight(mid("about"))).toBe(0);
    expect(careerWeight(mid("agentic"))).toBe(0);
  });

  it("figure turns to walk into the distance during the career pages only", () => {
    expect(heading(mid("esas"))).toBeCloseTo(Math.PI);
    expect(heading(mid("about"))).toBe(0);
    expect(heading(mid("skills"))).toBe(0);
  });

  it("each career page brings its own milestones to the figure", () => {
    const gates = { education: 2, esas: 1, mobileye: 1 };
    expect(careerTravel(st("education").start, gates)).toBe(0);
    expect(careerTravel(st("education").end, gates)).toBeCloseTo(2); // B.Eng and M.Sc passed
    expect(careerTravel(mid("esas"), gates)).toBeCloseTo(2.5);
    expect(careerTravel(st("mobileye").end, gates)).toBeCloseTo(4);
    expect(careerTravel(0, gates)).toBe(0);
    expect(careerTravel(1, gates)).toBe(4);
  });
});
