import { test, expect, type Page } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fabian Riegsinger" })).toBeVisible();
});

test("cv text in DOM", async ({ page }) => {
  await page.goto("/");
  for (const text of ["Mobileye Germany GmbH", "ESAS Automotive GmbH", "Claude Code", "snap-notes"]) {
    await expect(page.getByText(text, { exact: false }).first()).toBeAttached();
  }
});

test("no phone number", async ({ page }) => {
  await page.goto("/");
  expect(await page.content()).not.toMatch(/\+49/);
});

test("mobile 360px no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("contact links are 44px targets", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // the 3D upgrade replaces the DOM: act on the final one
  const links = page.locator("#contact a");
  await expect(links.first()).toBeAttached();
  expect(await links.count()).toBeGreaterThanOrEqual(4);
  for (const link of await links.all()) {
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test("focus ring visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // the 3D upgrade replaces the DOM: act on the final one
  const first = page.locator("#contact a").first();
  await first.focus();
  expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
});

test("canvas mounts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
});

/** No WebGL: the one thing that keeps the page static (reduced motion gets calm 3D). */
const withoutWebGL = (page: Page) => page.addInitScript(() => (HTMLCanvasElement.prototype.getContext = () => null));

test("no WebGL shows static page", async ({ page }) => {
  await withoutWebGL(page);
  await page.goto("/");
  await expect(page.getByText("Mobileye Germany GmbH").first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("reduced motion still gets the 3D page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
});

test("missing model falls back", async ({ page }) => {
  await page.route("**/figure.glb", (r) => r.abort());
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByText("Mobileye Germany GmbH").first()).toBeVisible();
});

test("json-ld present", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw!);
  expect(data["@type"]).toBe("Person");
  expect(data.sameAs).toHaveLength(3);
  expect(raw).not.toContain("@web.de");
});

for (const path of ["/impressum", "/privacy"]) {
  test(`legal page ${path} loads`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
}

test("metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Fabian Riegsinger — System Integration & Software Engineer");
  expect(await page.locator('meta[property="og:image"]').count()).toBeGreaterThan(0);
});

test("hero text stays uncovered while the model loads", async ({ page }) => {
  await page.route("**/figure.glb", async (r) => {
    await new Promise((res) => setTimeout(res, 4000));
    await r.continue();
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 });
  const heading = page.getByRole("heading", { name: "Fabian Riegsinger" });
  const box = (await heading.boundingBox())!;
  const covered = await page.evaluate(
    ([x, y]) => !document.elementFromPoint(x, y)?.closest("h1"),
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(covered).toBe(false);
});

test("career timeline runs oldest to newest", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("main").first().innerText()).replace(/\s+/g, " ");
  const order = ["B.Eng.", "M.Sc.", "ESAS Automotive GmbH", "Mobileye Germany GmbH"].map((t) => text.indexOf(t));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("apple glass: every text panel is frosted glass left of the centred figure", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 });
  // Read every panel in one go: the 3D upgrade replaces the DOM, so per-element handles can go stale.
  const panels = await page.evaluate(() =>
    [...document.querySelectorAll("[data-glass]")].map((el) => {
      const s = getComputedStyle(el);
      return { right: el.getBoundingClientRect().right, backdrop: s.backdropFilter, radius: parseFloat(s.borderRadius) };
    }),
  );
  expect(panels).toHaveLength(9);
  for (const p of panels) {
    expect(p.right).toBeLessThanOrEqual(1440 * 0.42);
    expect(p.backdrop).toContain("blur");
    expect(p.radius).toBeGreaterThanOrEqual(24);
  }
});

test("nine pages in order, each its own glass panel", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main section").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(["hero", "about", "education", "esas", "mobileye", "agentic", "skills", "launch", "contact"]);
  await expect(page.locator("#education")).toContainText("B.Eng.");
  await expect(page.locator("#education")).toContainText("M.Sc.");
  await expect(page.locator("#esas h2")).toHaveText("ESAS Automotive GmbH");
  await expect(page.locator("#mobileye h2")).toHaveText("Mobileye Germany GmbH");
});

test("pages snap and panels fade in with scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // the 3D upgrade replaces the DOM: act on the final one
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("y mandatory"); // a scroll always settles on a page
  expect(await page.locator("#about").evaluate((el) => getComputedStyle(el).scrollSnapAlign)).toContain("start");
  const timeline = await page.locator("#about [data-glass]").evaluate((el) => getComputedStyle(el).getPropertyValue("animation-timeline"));
  expect(timeline).toContain("view");
});

test("glass panel tilts toward the mouse and settles when it leaves", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // tilt the final (3D) DOM, not the static one it replaces
  const panel = page.locator("#hero [data-glass]");
  // Re-measure and re-hover until the tilt shows: under load a single early pointer event can be dropped.
  await expect(async () => {
    const box = (await panel.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2, { steps: 4 });
    expect(await panel.evaluate((el) => el.style.transform)).toContain("rotateY(");
  }).toPass({ timeout: 10_000 });
  const ry = await panel.evaluate((el) => parseFloat(/rotateY\((-?[\d.]+)deg\)/.exec(el.style.transform)![1]));
  expect(ry).toBeGreaterThan(2);
  // Same for leaving: re-enter and leave until the panel settles.
  await expect(async () => {
    const box = (await panel.boundingBox())!;
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2);
    await page.mouse.move(5, 5, { steps: 4 });
    expect(await panel.evaluate((el) => el.style.transform)).toBe("");
  }).toPass({ timeout: 10_000 });
});

test("hero fallback figure never flashes before the page decides between 3D and static", async ({ page }) => {
  // First paint = server HTML before any script runs: the still must already be hidden there.
  await page.route(/\/_next\/static\/chunks\/.*\.js(\?.*)?$/, (r) => r.abort());
  await page.goto("/");
  await expect(page.locator('img[src="/fallback.webp"]')).toBeAttached();
  await expect(page.locator('img[src="/fallback.webp"]')).toBeHidden();
});

test("static page still shows the fallback figure", async ({ page }) => {
  await withoutWebGL(page);
  await page.goto("/");
  await expect(page.locator('img[src="/fallback.webp"]')).toBeVisible();
});

for (const [id, rgb, brand] of [
  ["education", "128, 186, 36", "THM green"],
  ["esas", "242, 85, 68", "ESAS coral"],
  ["mobileye", "30, 46, 184", "Mobileye blue"],
  ["launch", "255, 106, 26", "ignition orange"],
] as const) {
  test(`background blobs take ${brand} on the ${id} page`, async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // scroll the final (3D) DOM, not the static one it replaces
    const blob = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--blob-a"));
    expect(await blob()).not.toContain(rgb);
    await page.evaluate((id) => {
      const el = document.getElementById(id)!;
      window.scrollTo({ top: el.offsetTop + el.offsetHeight / 2 - innerHeight / 2, behavior: "instant" });
    }, id);
    // Long timeout: the first view of a scene compiles its shaders, which in software WebGL (CI, headless) stalls frames
    // and with them the CSS colour transition for several seconds.
    await expect.poll(blob, { timeout: 15_000 }).toContain(rgb);
  });
}

test("once the 3D page is up, the static page never flashes back in", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 });
  for (let i = 0; i < 20; i++) {
    expect(await page.locator("section#hero").count()).toBe(1);
    await page.waitForTimeout(100);
  }
});

for (const id of ["agentic", "skills"]) {
  test(`${id} heading stays in view while its tall panel scrolls`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // measure the final (3D) DOM, not the static one it replaces
    await page.evaluate((id) => {
      const el = document.getElementById(id)!;
      window.scrollTo({ top: el.offsetTop + el.offsetHeight / 2 - innerHeight / 2, behavior: "instant" });
    }, id);
    const box = (await page.locator(`#${id} h2`).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(800);
  });
}

test("landing page invites scrolling with a cue that jumps to the about page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 10_000 }); // check the final (3D) DOM, not the static one it replaces
  const cue = page.locator('#hero a[href="#about"]');
  await expect(cue).toBeVisible();
  const box = (await cue.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("launch page counts down the next challenges and hands over to contact", async ({ page }) => {
  await page.goto("/");
  const launch = page.locator("#launch");
  for (const t of ["T-3", "T-2", "T-1"]) await expect(launch).toContainText(t);
  await expect(launch.locator('a[href="#contact"]')).toBeAttached();
});

test("hero Contact button jumps straight to the contact page", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero").getByRole("link", { name: "Contact" }).click();
  // Instant, not a smooth scroll through every page: already there on the next frame.
  const offset = await page.evaluate(() => new Promise<number>((r) => requestAnimationFrame(() => r(document.getElementById("contact")!.getBoundingClientRect().top))));
  expect(Math.abs(offset)).toBeLessThan(2);
  expect(page.url()).toMatch(/#contact$/);
});
