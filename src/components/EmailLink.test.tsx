import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { EmailLink } from "./EmailLink";

afterEach(cleanup);

describe("EmailLink", () => {
  it("does not render the address in HTML", () => {
    const { container } = render(<EmailLink user="fabian.riegsinger" domain="web.de">Email</EmailLink>);
    expect(container.innerHTML).not.toContain("@web.de");
  });

  it("opens mailto on click", () => {
    const original = window.location;
    const loc = { href: "" };
    Object.defineProperty(window, "location", { value: loc, configurable: true });
    const { getByText } = render(<EmailLink user="fabian.riegsinger" domain="web.de">Email</EmailLink>);
    fireEvent.click(getByText("Email"));
    expect(loc.href).toBe("mailto:fabian.riegsinger@web.de");
    Object.defineProperty(window, "location", { value: original, configurable: true });
  });
});
