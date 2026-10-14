import { describe, it, expect } from "vitest";
import { STATIONS, stationAt, localProgress, toStationOffset, stationWeight, heading, PANEL_EDGE } from "./scroll-map";

const st = (id: string) => STATIONS.find((s) => s.id === id)!;
const mid = (id: string) => (st(id).start + st(id).end) / 2;

describe("scroll-map", () => {
  it("has one station per page, in page order", () => {
    expect(STATIONS.map((s) => s.id)).toEqual(["hero", "about", "education", "esas", "mobileye", "agentic", "skills", "launch", "contact"]);
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

  it("career pages are scenes, not a walk: ringing the graduation bell, team talk, customer fleet", () => {
    expect(stationAt(mid("education")).clip).toBe("ring");
    expect(stationAt(mid("esas")).clip).toBe("laptop");
    expect(stationAt(mid("mobileye")).clip).toBe("tablet");
    expect(STATIONS.some((s) => s.clip === "walk")).toBe(false);
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

  it("on the about page the figure thinks, turned part-way toward the text panel (screen left)", () => {
    expect(stationAt(mid("about")).clip).toBe("think");
    expect(heading(mid("about"))).toBeLessThan(-0.2);
    expect(heading(mid("about"))).toBeGreaterThan(-Math.PI / 4);
  });

  it("heading is each page's yaw in the middle of the page, eased in between", () => {
    for (const st of STATIONS) expect(heading((st.start + st.end) / 2)).toBeCloseTo(st.yaw);
    expect(heading(mid("hero"))).toBe(0);
    const edge = st("esas").end - 0.001;
    expect(heading(edge)).toBeGreaterThan(Math.min(st("esas").yaw, st("mobileye").yaw) - 1e-9);
    expect(heading(edge)).toBeLessThan(Math.max(st("esas").yaw, st("mobileye").yaw) + 1e-9);
  });

  it("faces the team on the ESAS page (turned to screen right, where the colleagues stand)", () => {
    expect(st("esas").yaw).toBeGreaterThan(0.3);
  });
});

describe("screen shift", () => {
  it("centres the figure between the text panel's right edge and the screen edge, further right on the agentic page", () => {
    const between = (PANEL_EDGE + 1) / 2;
    for (const s of STATIONS.filter((s) => s.id !== "agentic")) expect(0.5 + s.shift).toBeCloseTo(between);
    expect(PANEL_EDGE).toBeCloseTo(0.39); // 3vw gutter + 36vw panel (Section/GlassPanel)
    expect(0.5 + st("agentic").shift).toBeGreaterThanOrEqual(0.75);
  });
});
