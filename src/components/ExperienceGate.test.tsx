import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ExperienceGate } from "./ExperienceGate";
import { cv } from "@/content/cv";

const env = vi.hoisted(() => ({ hasWebGL: true, reducedMotion: false, isMobile: false }));
vi.mock("@/lib/capabilities", async (orig) => ({
  ...(await orig<typeof import("@/lib/capabilities")>()),
  detectEnv: () => env,
}));

afterEach(() => {
  cleanup();
  env.hasWebGL = true;
});

describe("ExperienceGate", () => {
  it("renders the static children when 3D is not possible", () => {
    env.hasWebGL = false;
    const Experience = () => <p>3d</p>;
    render(<ExperienceGate cv={cv} projects={[]} Experience={Experience}><p>static</p></ExperienceGate>);
    expect(screen.getByText("static")).toBeTruthy();
    expect(screen.queryByText("3d")).toBeNull();
  });

  it("swaps in the 3D experience when capable", async () => {
    const Experience = () => <p>3d</p>;
    render(<ExperienceGate cv={cv} projects={[]} Experience={Experience}><p>static</p></ExperienceGate>);
    expect(await screen.findByText("3d")).toBeTruthy();
  });

  it("falls back to static children when the experience throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Experience = () => {
      throw new Error("model 404");
    };
    render(<ExperienceGate cv={cv} projects={[]} Experience={Experience}><p>static</p></ExperienceGate>);
    expect(await screen.findByText("static")).toBeTruthy();
  });
});
