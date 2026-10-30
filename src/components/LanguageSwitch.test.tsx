import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageSwitch } from "./LanguageSwitch";

describe("LanguageSwitch", () => {
  it("on English, offers German for the same page", () => {
    render(<LanguageSwitch locale="en" page="/privacy" className="" />);
    const link = screen.getByRole("link", { name: /german/i });
    expect(link.getAttribute("href")).toBe("/language?to=de&page=%2Fprivacy");
    expect(link.textContent).toBe("DE");
  });
  it("on German, offers English for the same page", () => {
    render(<LanguageSwitch locale="de" page="/" className="" />);
    const link = screen.getByRole("link", { name: /englisch/i });
    expect(link.getAttribute("href")).toBe("/language?to=en&page=%2F");
    expect(link.textContent).toBe("EN");
  });
});
