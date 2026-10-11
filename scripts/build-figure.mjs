// Usage: node scripts/build-figure.mjs <in.glb> <out.glb> <srcClip=clip> [...]
// Keeps only the listed animations, renames them to our clip names, Draco-compresses.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, prune, dedup } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const [input, output, ...pairs] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: build-figure.mjs <in.glb> <out.glb> <srcClip=clip>...");
const rename = new Map(pairs.map((p) => p.split("=")));

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "draco3d.encoder": await draco3d.createEncoderModule(), "draco3d.decoder": await draco3d.createDecoderModule() });
const doc = await io.read(input);

for (const anim of doc.getRoot().listAnimations()) {
  const to = rename.get(anim.getName());
  if (to) anim.setName(to);
  else anim.dispose();
}
const kept = doc.getRoot().listAnimations().map((a) => a.getName());
const missing = [...rename.values()].filter((c) => !kept.includes(c));
if (missing.length) throw new Error(`clips not found: ${missing.join(", ")}`);

await doc.transform(prune(), dedup(), draco());
await io.write(output, doc);
console.log(`wrote ${output} with clips: ${kept.join(", ")}`);
