# Model assets

| File | Source | License |
|---|---|---|
| `figure.glb` | **Placeholder.** three.js example `examples/models/gltf/Xbot.glb` (r186), originally from Mixamo. Clips kept: `idle`, `walk`. | Mixamo-derived; terms unverified for this use. **Replace before launch.** |

Rebuild: `node scripts/build-figure.mjs <in.glb> public/models/figure.glb <srcClip>=<clip> ...`
Clip names the site uses: `idle`, `walk`, `typing`, `wave`. Missing clips fall back to `idle`.
