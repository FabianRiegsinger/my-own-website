import { describe, it, expect } from "vitest";
import { STATIONS, stationAt, localProgress } from "./scroll-map";

describe("scroll-map", () => {
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

  it("timeline walks", () => {
    expect(stationAt(0.45).clip).toBe("walk");
  });

  it("local progress is relative to the station", () => {
    expect(localProgress(0.45)).toBeCloseTo(0.5);
  });
});
