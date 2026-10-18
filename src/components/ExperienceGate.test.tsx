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
  delete document.documentElement.dataset.experience;
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

  it("marks the page as settled on static when 3D is not possible", () => {
    env.hasWebGL = false;
    render(<ExperienceGate cv={cv} projects={[]} Experience={() => <p>3d</p>}><p>static</p></ExperienceGate>);
    expect(document.documentElement.dataset.experience).toBe("static");
  });

  it("does not mark the page static while upgrading to 3D", async () => {
    render(<ExperienceGate cv={cv} projects={[]} Experience={() => <p>3d</p>}><p>static</p></ExperienceGate>);
    await screen.findByText("3d");
    expect(document.documentElement.dataset.experience).toBeUndefined();
  });

  it("marks the page static when the experience throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Experience = () => {
      throw new Error("model 404");
    };
    render(<ExperienceGate cv={cv} projects={[]} Experience={Experience}><p>static</p></ExperienceGate>);
    await screen.findByText("static");
    expect(document.documentElement.dataset.experience).toBe("static");
  });
});
