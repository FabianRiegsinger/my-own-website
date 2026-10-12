import { test, expect } from "@playwright/test";

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
  const first = page.locator("#contact a").first();
  await first.focus();
  expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
});

test("canvas mounts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
});

test("reduced motion shows static page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("Mobileye Germany GmbH").first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
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
  await expect(page).toHaveTitle("Fabian Riegsinger — Automotive Engineer → Agentic Builder");
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
  const panels = page.locator("[data-glass]");
  expect(await panels.count()).toBe(8);
  for (const p of await panels.all()) {
    const box = (await p.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(1440 * 0.42);
    expect(await p.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain("blur");
    expect(parseFloat(await p.evaluate((el) => getComputedStyle(el).borderRadius))).toBeGreaterThanOrEqual(24);
  }
});

test("eight pages in order, each its own glass panel", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main section").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(["hero", "about", "education", "esas", "mobileye", "skills", "agentic", "contact"]);
  await expect(page.locator("#education")).toContainText("B.Eng.");
  await expect(page.locator("#education")).toContainText("M.Sc.");
  await expect(page.locator("#esas h2")).toHaveText("ESAS Automotive GmbH");
  await expect(page.locator("#mobileye h2")).toHaveText("Mobileye Germany GmbH");
});

test("pages snap and panels fade in with scroll", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toMatch(/^y( proximity)?$/); // proximity is the default, so browsers may omit it
  expect(await page.locator("#about").evaluate((el) => getComputedStyle(el).scrollSnapAlign)).toContain("start");
  const timeline = await page.locator("#about [data-glass]").evaluate((el) => getComputedStyle(el).getPropertyValue("animation-timeline"));
  expect(timeline).toContain("view");
});

test("glass panel tilts toward the mouse and settles when it leaves", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const panel = page.locator("#hero [data-glass]");
  const box = (await panel.boundingBox())!;
  await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2);
  await expect.poll(() => panel.evaluate((el) => el.style.transform)).toContain("rotateY(");
  const ry = await panel.evaluate((el) => parseFloat(/rotateY\((-?[\d.]+)deg\)/.exec(el.style.transform)![1]));
  expect(ry).toBeGreaterThan(2);
  await page.mouse.move(5, 5);
  await expect.poll(() => panel.evaluate((el) => el.style.transform)).toBe("");
});
