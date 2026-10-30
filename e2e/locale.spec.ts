import { expect, test } from "@playwright/test";

test("German visitor on / is sent to /de and the cookie is set", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "DE" }, maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(/\/de$/);
  expect(res.headers()["set-cookie"]).toContain("lang=de");
});

test("visitor from elsewhere stays on English", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "US" }, maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("a lang=en cookie beats a German IP", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "DE", cookie: "lang=en" }, maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("a lang=de cookie sends a visitor from anywhere to /de", async ({ request }) => {
  const res = await request.get("/", { headers: { "x-vercel-ip-country": "US", cookie: "lang=de" }, maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(/\/de$/);
});

test("switch link on /privacy goes to /de/privacy and sets the cookie", async ({ request }) => {
  const res = await request.get("/language?to=de&page=/privacy", { maxRedirects: 0 });
  expect(res.headers()["location"]).toMatch(/\/de\/privacy$/);
  expect(res.headers()["set-cookie"]).toContain("lang=de");
});

test("an off-site page parameter is ignored", async ({ request }) => {
  const res = await request.get("/language?to=en&page=https://evil.example", { maxRedirects: 0 });
  expect(res.headers()["location"]).toMatch(/\/$/);
  expect(res.headers()["location"]).not.toContain("evil.example");
});

test("unknown German path returns 404", async ({ request }) => {
  const res = await request.get("/de/xyz");
  expect(res.status()).toBe(404);
});

test("unknown English path returns 404", async ({ request }) => {
  const res = await request.get("/xx");
  expect(res.status()).toBe(404);
});

test("German homepage shows German text and the switch links to English", async ({ page }) => {
  await page.goto("/de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("link", { name: "Kontakt" }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/language?to=en&page=%2F");
});

test("the switch on the German privacy page points back to the English privacy page", async ({ page }) => {
  await page.goto("/de/privacy");
  await expect(page.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/language?to=en&page=%2Fprivacy");
});

test("German homepage footer links to the German legal pages", async ({ page }) => {
  await page.goto("/de");
  await expect(page.locator("footer a", { hasText: "Impressum" })).toHaveAttribute("href", "/de/impressum");
  await expect(page.locator("footer a", { hasText: "Datenschutz" })).toHaveAttribute("href", "/de/privacy");
});
