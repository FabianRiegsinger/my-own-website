import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { en } from "@/i18n/en";
import { ReducedMotionNotice } from "./ReducedMotionNotice";

let listener: (() => void) | undefined;
const mq = { matches: false, addEventListener: (_: string, l: () => void) => (listener = l), removeEventListener: () => {} };
vi.stubGlobal("matchMedia", () => mq);

afterEach(() => {
  cleanup();
  mq.matches = false;
});

describe("ReducedMotionNotice", () => {
  it("stays hidden without reduced motion", () => {
    render(<ReducedMotionNotice t={en} />);
    expect(screen.queryByText("Reduced motion is on")).toBeNull();
  });

  it("shows when reduced motion is on, and the info button reveals how to enable animations", () => {
    mq.matches = true;
    render(<ReducedMotionNotice t={en} />);
    expect(screen.getByText("Reduced motion is on")).toBeTruthy();
    expect(screen.queryByText(/turn off reduced motion/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "How to enable animations" }));
    expect(screen.getByText(/turn off reduced motion/)).toBeTruthy();
  });

  it("follows the setting when it changes while the page is open", () => {
    render(<ReducedMotionNotice t={en} />);
    mq.matches = true;
    act(() => listener?.());
    expect(screen.getByText("Reduced motion is on")).toBeTruthy();
  });
});
