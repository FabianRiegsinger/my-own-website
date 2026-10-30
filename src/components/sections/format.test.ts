import { describe, expect, it } from "vitest";
import { de } from "@/i18n/de";
import { en } from "@/i18n/en";
import { formatMonth } from "./format";

describe("formatMonth", () => {
  it("shows English month names and Present in English", () => {
    expect(formatMonth("2024-12", en.timeline)).toBe("Dec 2024");
    expect(formatMonth(null, en.timeline)).toBe("Present");
  });
  it("shows German month names and heute in German", () => {
    expect(formatMonth("2024-03", de.timeline)).toBe("Mär 2024");
    expect(formatMonth(null, de.timeline)).toBe("heute");
  });
});
