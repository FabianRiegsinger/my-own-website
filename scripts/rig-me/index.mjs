// Usage: node scripts/rig-me/index.mjs [scan.glb] [out.glb]
// Turns the static T-pose scan of Fabian (default assets-src/me.glb, kept out of git) into public/models/me.glb:
// welded and simplified, rigged onto figure.glb's Mixamo skeleton with its clips, painted regions baked in,
// glasses and pupils added as geometry on the head bone, Draco-compressed. The rigging runs in headless Chromium
// (rig.browser.js), where three.js, its Draco decoder and GLTFExporter work as on the site.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const [input = "assets-src/me.glb", output = "public/models/me.glb"] = process.argv.slice(2);
const tmp = mkdtempSync(join(tmpdir(), "rig-me-"));
const gltf = (...args) => execFileSync("npx", ["gltf-transform", ...args], { stdio: "inherit" });

gltf("weld", input, join(tmp, "welded.glb"));
gltf("simplify", join(tmp, "welded.glb"), join(tmp, "simple.glb"), "--ratio", "0.25", "--error", "0.0005");

const files = { "/me.glb": join(tmp, "simple.glb"), "/figure.glb": join(ROOT, "public/models/figure.glb") };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("console", (m) => !/PropertyBinding|GL Driver/.test(m.text()) && console.log("[rig]", m.text()));
await page.route("http://local/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/")
    return r.fulfill({
      contentType: "text/html",
      body: `<!doctype html><body style="margin:0"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/rig.js"></script>`,
    });
  if (u === "/rig.js") return r.fulfill({ contentType: "text/javascript", body: readFileSync(join(ROOT, "scripts/rig-me/rig.browser.js")) });
  if (u.startsWith("/three/")) return r.fulfill({ contentType: "text/javascript", body: readFileSync(join(ROOT, "node_modules", u)) });
  if (u.startsWith("/draco/")) return r.fulfill({ body: readFileSync(join(ROOT, "public", u)), contentType: u.endsWith(".wasm") ? "application/wasm" : "text/javascript" });
  if (files[u]) return r.fulfill({ body: readFileSync(files[u]), contentType: "model/gltf-binary" });
  return r.fulfill({ status: 404, body: "" });
});
await page.goto("http://local/");
const result = await page.waitForFunction(() => window.__result, null, { timeout: 300_000 }).then((h) => h.jsonValue());
await page.screenshot({ path: join(tmp, "preview.png") });
await browser.close();
if (result.error) throw new Error(result.error);

writeFileSync(join(tmp, "rigged.glb"), Buffer.from(result.glb, "base64"));
gltf("draco", join(tmp, "rigged.glb"), output);
console.log(`wrote ${output}: ${result.verts} vertices, ${result.tris} triangles, clips ${result.clips.join(", ")}; preview ${join(tmp, "preview.png")}`);
