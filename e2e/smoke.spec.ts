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
