import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cvEn } from "@/content/cv.en";
import { en } from "@/i18n/en";
import { BusinessCard } from "./BusinessCard";

const card = () => screen.getByText(cvEn.profile.name).closest("[data-flipped]")!;

describe("BusinessCard", () => {
  afterEach(cleanup);

  it("shows the front first, with name, headline and location", () => {
    render(<BusinessCard profile={cvEn.profile} t={en.contact} />);
    expect(card().getAttribute("data-flipped")).toBe("false");
    expect(screen.getByText(cvEn.profile.headline)).toBeTruthy();
    expect(screen.getByText(cvEn.profile.location)).toBeTruthy();
    expect(screen.getByText("FR")).toBeTruthy();
  });

  it("turns over to the contact links and moves focus there, and back again", () => {
    render(<BusinessCard profile={cvEn.profile} t={en.contact} />);
    fireEvent.click(screen.getByRole("button", { name: en.contact.flip }));
    expect(card().getAttribute("data-flipped")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "GitHub" }));

    fireEvent.click(screen.getByRole("button", { name: en.contact.flipBack }));
    expect(card().getAttribute("data-flipped")).toBe("false");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: en.contact.flip }));
  });

  it("turns up whichever face keyboard focus enters, and Escape turns back", () => {
    render(<BusinessCard profile={cvEn.profile} t={en.contact} />);
    const linkedin = screen.getByRole("link", { name: "LinkedIn" });
    fireEvent.focus(linkedin);
    expect(card().getAttribute("data-flipped")).toBe("true");
    fireEvent.keyDown(linkedin, { key: "Escape" });
    expect(card().getAttribute("data-flipped")).toBe("false");
  });

  it("keeps every contact link, with the email address never in the markup", () => {
    const { container } = render(<BusinessCard profile={cvEn.profile} t={en.contact} />);
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(cvEn.profile.links.github);
    expect(screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href")).toBe(cvEn.profile.links.linkedin);
    expect(screen.getByRole("link", { name: "Xing" }).getAttribute("href")).toBe(cvEn.profile.links.xing);
    expect(screen.getByRole("link", { name: en.contact.email }).getAttribute("href")).toBe("#");
    expect(container.innerHTML).not.toContain("@web.de");
  });
});
