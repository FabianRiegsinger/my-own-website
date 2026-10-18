// Usage: node scripts/build-colleagues.mjs [me.glb] [outDir]
// Builds the ESAS colleagues (public/models/colleague-<id>.glb, see stations/Team.tsx) from Fabian's own model:
// each is his mesh re-sculpted (own haircut and face shape), glasses dropped, welded, Loop-subdivided for a smooth
// surface, untextured (plain clay) and Draco-compressed. Model units: he stands ~1 tall, faces +x, up +y.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const [input = "public/models/me.glb", outDir = "public/models"] = process.argv.slice(2);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "draco3d.encoder": await draco3d.createEncoderModule(), "draco3d.decoder": await draco3d.createDecoderModule() });

const smooth = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
const lerp3 = (p, q, t) => p.map((v, k) => v + (q[k] - v) * t);

// ---------- read his mesh ----------

async function readMesh(path) {
  const doc = await io.read(path);
  const root = doc.getRoot();
  const prim = root.listMeshes()[0].listPrimitives()[0];
  const get = (s) => prim.getAttribute(s).getArray();
  const m = { P: get("POSITION"), UV: get("TEXCOORD_0"), J: get("JOINTS_0"), W: get("WEIGHTS_0"), I: prim.getIndices().getArray() };
  m.n = m.P.length / 3;
  const head = root.listSkins()[0].listJoints().findIndex((j) => j.getName() === "Head");
  m.headW = Float32Array.from({ length: m.n }, (_, i) => [0, 1, 2, 3].reduce((s, c) => s + (m.J[i * 4 + c] === head ? m.W[i * 4 + c] : 0), 0));
  // Same position = same point (UV seams split vertices): the welded id, and the islands (connected parts) on it.
  const ids = new Map();
  m.wid = Int32Array.from({ length: m.n }, (_, i) => {
    const k = [0, 1, 2].map((c) => Math.round(m.P[i * 3 + c] * 1e4)).join();
    if (!ids.has(k)) ids.set(k, ids.size);
    return ids.get(k);
  });
  const par = Int32Array.from({ length: ids.size }, (_, i) => i);
  const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
  for (let t = 0; t < m.I.length; t += 3) {
    par[find(m.wid[m.I[t]])] = find(m.wid[m.I[t + 1]]);
    par[find(m.wid[m.I[t + 1]])] = find(m.wid[m.I[t + 2]]);
  }
  m.island = Int32Array.from({ length: m.n }, (_, i) => find(m.wid[i]));
  // Colour per vertex from the base colour texture: tells hair from skin.
  const tex = root.listMaterials()[0].getBaseColorTexture();
  const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(512, 512).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  m.C = new Float32Array(m.n * 3);
  for (let i = 0; i < m.n; i++) {
    const x = Math.min(info.width - 1, Math.floor(m.UV[i * 2] * info.width));
    const y = Math.min(info.height - 1, Math.floor(m.UV[i * 2 + 1] * info.height));
    for (let c = 0; c < 3; c++) m.C[i * 3 + c] = data[(y * info.width + x) * 3 + c] / 255;
  }
  return m;
}

const m = await readMesh(input);
const { n, P: P0 } = m;

// Head islands: the head itself (the largest), the glasses (frame and a temple arm: long front to back), eyes and mouth.
const islands = new Map();
for (let i = 0; i < n; i++) {
  const o = islands.get(m.island[i]) ?? { n: 0, head: 0, minX: Infinity, maxX: -Infinity };
  o.n++;
  o.head += m.headW[i] > 0.5;
  o.minX = Math.min(o.minX, P0[i * 3]);
  o.maxX = Math.max(o.maxX, P0[i * 3]);
  islands.set(m.island[i], o);
}
const headIslands = [...islands].filter(([, o]) => o.head / o.n > 0.9).sort((a, b) => b[1].n - a[1].n);
const MAIN = headIslands[0][0];
const GLASSES = new Set(headIslands.slice(1).filter(([, o]) => o.maxX - o.minX > 0.1).map(([id]) => id));
if (GLASSES.size !== 2) throw new Error(`expected the glasses as 2 islands, found ${GLASSES.size}`);

// ---------- sculpt ----------

// Neighbours across UV seams, for softening the hair mask's edge.
const nb = Array.from({ length: n }, () => new Set());
for (let t = 0; t < m.I.length; t += 3) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) nb[m.I[t + a]].add(m.I[t + b]);
const byWeld = new Map();
for (let i = 0; i < n; i++) byWeld.set(m.wid[i], [...(byWeld.get(m.wid[i]) ?? []), i]);
for (const g of byWeld.values()) for (const i of g) for (const j of g) if (i !== j) for (const k of nb[j]) nb[i].add(k);

const isHead = (i) => m.island[i] === MAIN && m.headW[i] > 0.5;
// Hair: dark, reddish-brown texels on the head, above the ears; the dark lashes and brows are not hair.
let hair = Float32Array.from({ length: n }, (_, i) => {
  const [r, g, b] = [m.C[i * 3], m.C[i * 3 + 1], m.C[i * 3 + 2]];
  const [x, y] = [P0[i * 3], P0[i * 3 + 1]];
  const lashes = x > 0.05 && y < 0.875;
  return isHead(i) && !lashes && y > 0.8 && 0.3 * r + 0.59 * g + 0.11 * b < 0.33 && r > b ? 1 : 0;
});
for (let it = 0; it < 2; it++)
  hair = Float32Array.from(hair, (h, i) => {
    let s = h;
    for (const j of nb[i]) s += hair[j];
    return Math.max(h * 0.5, s / (nb[i].size + 1));
  });

const C = [-0.012, 0.85, 0]; // skull centre
const RS = [0.125, 0.12, 0.118]; // skull ellipsoid radii around C
/** Where direction `d` (from C) meets the skull ellipsoid scaled by `scale`, plus `pad`. */
const shellAt = (d, scale, pad) => {
  const L = Math.hypot(...d) || 1;
  const u = d.map((v) => v / L);
  return { L, u, r: scale / Math.hypot(u[0] / RS[0], u[1] / RS[1], u[2] / RS[2]) + pad };
};

/**
 * Moves the head (and body) by `fn(p, d, i, hair, headWeight)`; eyes and mouth (their own islands) follow `face`, the
 * face's overall reshaping, so the skin never cuts through them.
 */
function sculpt(fn, face, { shell, ears = false } = {}) {
  const P = Float32Array.from(P0);
  const H = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const main = m.island[i] === MAIN;
    if (!main && (GLASSES.has(m.island[i]) || m.headW[i] <= 0.5)) continue;
    const p = [P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]];
    const d = p.map((v, k) => v - C[k]);
    // Above the hairline everything counts as hair (the quiff's strands too), so no old strand pokes through a new cut.
    let h = isHead(i) ? Math.max(hair[i], smooth((p[1] - 0.88) / 0.02)) : hair[i];
    if (ears) h *= 1 - ear(p);
    if (main) H[i] = h;
    const q = main ? fn(p, d, i, h, m.headW[i]) : face?.(p);
    if (q) P.set(q, i * 3);
  }
  if (shell) relaxHair(P, H, shell);
  return P;
}

/** 1 on the ears (out at the sides, eye to mouth height), so a fuller haircut can leave them showing. */
const ear = ([x, y, z]) => smooth((Math.abs(z) - 0.1) / 0.012) * smooth((0.875 - y) / 0.012) * smooth((y - 0.755) / 0.01) * smooth((0.05 - x) / 0.02);

/**
 * The quiff's strands fold over each other once pushed onto a shell (flat creased patches): smooth the hair (Laplacian,
 * by its weight) and put it back on the shell, `shell(u)` being the radius in direction `u` from C.
 */
function relaxHair(P, H, shell, iterations = 6) {
  for (let it = 0; it < iterations; it++) {
    const Q = Float32Array.from(P);
    for (let i = 0; i < n; i++) {
      if (H[i] <= 0) continue;
      const avg = [0, 0, 0];
      for (const j of nb[i]) for (let k = 0; k < 3; k++) avg[k] += P[j * 3 + k] / nb[i].size;
      const q = lerp3([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], avg, 0.6 * H[i]);
      const d = q.map((v, k) => v - C[k]);
      const L = Math.hypot(...d) || 1;
      const u = d.map((v) => v / L);
      Q.set(lerp3(q, C.map((c, k) => c + u[k] * shell(u)), H[i]), i * 3);
    }
    P.set(Q);
  }
}

/** Radar's hair surface: the skull shell, slightly fuller, with low ripples running front to back; short at the
 * sides down by the ears so they show. */
function radarHair(u) {
  const side = smooth((Math.abs(u[2]) - 0.6) / 0.3) * smooth((0.6 - u[1]) / 0.25);
  const { r } = shellAt(u, 1.07 - 0.1 * side, 0.006);
  return r * (1 + 0.045 * Math.sin(Math.atan2(u[2], u[0]) * 5 + u[1] * 3));
}

const VARIANTS = {
  // Buzz cut: the hair lies exactly on the skull. Square jaw, a little belly.
  camera: sculpt((p, d, i, h, hw) => {
    let q = p;
    const top = isHead(i) ? Math.max(h, smooth((p[1] - 0.86) / 0.02)) : 0;
    if (top > 0) {
      const { u, r, L } = shellAt(d, 0.97, 0.004);
      q = lerp3(p, C.map((c, k) => c + u[k] * (h > 0.5 ? r : Math.min(L, r))), top);
    }
    let [x, y, z] = q;
    if (hw > 0.5 && y < 0.79 && y > 0.69) z *= 1 + 0.14 * smooth((0.79 - y) / 0.05);
    x += 0.02 * smooth(1 - Math.abs(y - 0.5) / 0.1) * smooth(x / 0.04) * (hw < 0.1 ? 1 : 0);
    return [x, y, z];
  }),
  // Smooth bob: a full, sleek volume down to the neck at the back and over the ears. Narrow face, small nose.
  lidar: sculpt(
    (p, d, i, h, hw) => {
      let q = p;
      if (h > 0) {
        const { u, r } = shellAt(d, 1.1, 0.008);
        q = lerp3(p, C.map((c, k) => c + u[k] * r), h);
        const low = smooth((0.9 - p[1]) / 0.08) * smooth((0.05 - p[0]) / 0.06);
        q = [q[0] - 0.01 * h * low, q[1] - 0.075 * h * low, q[2] * (1 + 0.06 * h * low)];
      }
      let [x, y, z] = q;
      if (h === 0 && hw > 0.5) z *= 1 - 0.07 * smooth((0.86 - y) / 0.1);
      if (hw > 0.5 && x > 0.1 && y > 0.775 && y < 0.82 && Math.abs(z) < 0.03) x -= 0.35 * (x - 0.1); // nose
      return [x, y, z];
    },
    ([x, y, z]) => [x, y, z * (1 - 0.07 * smooth((0.86 - y) / 0.1))],
  ),
  // Short, soft waves: a little fuller than the skull, swept back in a few broad ripples, ears clear. Slightly broader face.
  radar: sculpt(
    (p, d, i, h, hw) => {
      let q = p;
      if (h > 0) {
        const { u } = shellAt(d, 1, 0);
        q = lerp3(p, C.map((c, k) => c + u[k] * radarHair(u)), h);
      }
      // Ears scaled up about their root: on untextured clay the original ones barely read.
      const e = ear(p);
      if (e > 0) q = lerp3(q, [-0.03, 0.805, 0.1 * Math.sign(q[2])].map((c, k) => c + (q[k] - c) * 1.2), e);
      const [x, y, z] = q;
      return [x, y, hw > 0.5 ? z * 1.02 : z];
    },
    ([x, y, z]) => [x, y, z * 1.02],
    { shell: radarHair, ears: true },
  ),
};

// ---------- smooth: weld, Loop-subdivide, normals ----------

/** One vertex per position (no UV seams left to split the shading), unreferenced ones dropped. */
function weld(P, J, W, I) {
  const ids = new Map();
  const remap = Int32Array.from({ length: P.length / 3 }, (_, i) => {
    const k = [0, 1, 2].map((c) => Math.round(P[i * 3 + c] * 1e5)).join();
    if (!ids.has(k)) ids.set(k, i);
    return ids.get(k);
  });
  const tris = [];
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [remap[I[t]], remap[I[t + 1]], remap[I[t + 2]]];
    if (a !== b && b !== c && a !== c) tris.push(a, b, c);
  }
  const used = new Map();
  const out = { P: [], J: [], W: [], I: [] };
  for (const v of tris) {
    if (!used.has(v)) {
      used.set(v, used.size);
      out.P.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
      for (let c = 0; c < 4; c++) {
        out.J.push(J[v * 4 + c]);
        out.W.push(W[v * 4 + c]);
      }
    }
    out.I.push(used.get(v));
  }
  return out;
}

/** Subdivision levels per vertex, by island: the head 2, the body 1, small parts in the head (eyes, mouth) none,
 * since Loop's smoothing would shrink them into their sockets. */
function islandLevels({ P, I }) {
  const n = P.length / 3;
  const par = Int32Array.from({ length: n }, (_, i) => i);
  const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
  for (let t = 0; t < I.length; t += 3) {
    par[find(I[t])] = find(I[t + 1]);
    par[find(I[t + 1])] = find(I[t + 2]);
  }
  const st = new Map();
  for (let i = 0; i < n; i++) {
    const o = st.get(find(i)) ?? { n: 0, y: 0 };
    o.n++;
    o.y += P[i * 3 + 1];
    st.set(find(i), o);
  }
  return Uint8Array.from({ length: n }, (_, i) => {
    const o = st.get(find(i));
    return o.y / o.n > 0.72 ? (o.n <= 400 ? 0 : 2) : 1;
  });
}

/** Mixes skin weights of `ids` by factors `f`, keeping the 4 strongest joints. */
function mixSkin(J, W, ids, f) {
  const acc = new Map();
  ids.forEach((v, k) => {
    for (let c = 0; c < 4; c++) if (W[v * 4 + c] > 0) acc.set(J[v * 4 + c], (acc.get(J[v * 4 + c]) ?? 0) + W[v * 4 + c] * f[k]);
  });
  const top = [...acc].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = top.reduce((s, [, w]) => s + w, 0) || 1;
  const j = [0, 0, 0, 0];
  const w = [0, 0, 0, 0];
  top.forEach(([jj, ww], c) => {
    j[c] = jj;
    w[c] = ww / sum;
  });
  return [j, w];
}

/** One step of Loop subdivision; triangles of `fixed` vertices are kept as they are. */
function loop({ P, J, W, I }, fixed) {
  const nv = P.length / 3;
  const p = (v, c) => P[v * 3 + c];
  const key = (a, b) => (a < b ? a * nv + b : b * nv + a);
  const kept = [];
  const tris = [];
  for (let t = 0; t < I.length; t += 3) (fixed[I[t]] ? kept : tris).push(I[t], I[t + 1], I[t + 2]);
  const edges = new Map();
  const nbr = Array.from({ length: nv }, () => new Set());
  for (let t = 0; t < tris.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const [a, b, c] = [tris[t + e], tris[t + ((e + 1) % 3)], tris[t + ((e + 2) % 3)]];
      if (!edges.has(key(a, b))) edges.set(key(a, b), { a, b, opp: [] });
      edges.get(key(a, b)).opp.push(c);
      nbr[a].add(b);
      nbr[b].add(a);
    }
  const rim = Array.from({ length: nv }, () => []);
  for (const e of edges.values())
    if (e.opp.length !== 2) {
      rim[e.a].push(e.b);
      rim[e.b].push(e.a);
    }
  const out = { P: [], J: [...J], W: [...W], I: [...kept] };
  for (let v = 0; v < nv; v++) {
    const r = rim[v];
    const k = nbr[v].size;
    const beta = k === 3 ? 3 / 16 : 3 / (8 * k);
    for (let c = 0; c < 3; c++) {
      if (fixed[v] || (r.length > 0 && r.length !== 2)) out.P.push(p(v, c));
      else if (r.length === 2) out.P.push(0.75 * p(v, c) + 0.125 * (p(r[0], c) + p(r[1], c)));
      else out.P.push((1 - k * beta) * p(v, c) + beta * [...nbr[v]].reduce((s, u) => s + p(u, c), 0));
    }
  }
  const mid = new Map();
  for (const [k, { a, b, opp }] of edges) {
    mid.set(k, out.P.length / 3);
    for (let c = 0; c < 3; c++) out.P.push(opp.length === 2 ? 0.375 * (p(a, c) + p(b, c)) + 0.125 * (p(opp[0], c) + p(opp[1], c)) : 0.5 * (p(a, c) + p(b, c)));
    const [j, w] = mixSkin(J, W, [a, b], [0.5, 0.5]);
    out.J.push(...j);
    out.W.push(...w);
  }
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]];
    const [ab, bc, ca] = [mid.get(key(a, b)), mid.get(key(b, c)), mid.get(key(c, a))];
    out.I.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
  }
  return out;
}

/** Area-weighted smooth vertex normals. */
function normals({ P, I }) {
  const N = new Float32Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
    const u = [0, 1, 2].map((k) => P[b * 3 + k] - P[a * 3 + k]);
    const v = [0, 1, 2].map((k) => P[c * 3 + k] - P[a * 3 + k]);
    const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const i of [a, b, c]) for (let k = 0; k < 3; k++) N[i * 3 + k] += f[k];
  }
  for (let i = 0; i < N.length; i += 3) {
    const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1;
    for (let k = 0; k < 3; k++) N[i + k] /= l;
  }
  return N;
}

// ---------- write ----------

const keep = [];
for (let t = 0; t < m.I.length; t += 3) if (!GLASSES.has(m.island[m.I[t]])) keep.push(m.I[t], m.I[t + 1], m.I[t + 2]);

for (const [id, P] of Object.entries(VARIANTS)) {
  let mesh = weld(P, m.J, m.W, keep);
  let level = islandLevels(mesh);
  for (let l = 0; l < 2; l++) {
    const nv = mesh.P.length / 3;
    mesh = loop(
      mesh,
      level.map((x) => (x <= l ? 1 : 0)),
    );
    // New edge points take their island's level (an edge never joins two islands).
    const next = new Uint8Array(mesh.P.length / 3);
    next.set(level);
    for (let t = 0; t < mesh.I.length; t += 3) {
      const corner = [0, 1, 2].map((k) => mesh.I[t + k]).find((v) => v < nv);
      if (corner !== undefined) for (let e = 0; e < 3; e++) if (mesh.I[t + e] >= nv) next[mesh.I[t + e]] = level[corner];
    }
    level = next;
  }

  const doc = await io.read(input);
  const root = doc.getRoot();
  const prim = root.listMeshes()[0].listPrimitives()[0];
  const JointArray = prim.getAttribute("JOINTS_0").getArray().constructor;
  const buffer = root.listBuffers()[0];
  const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  for (const s of prim.listSemantics()) prim.setAttribute(s, null);
  prim.setAttribute("POSITION", acc("VEC3", Float32Array.from(mesh.P)));
  prim.setAttribute("NORMAL", acc("VEC3", normals(mesh)));
  prim.setAttribute("JOINTS_0", acc("VEC4", JointArray.from(mesh.J)));
  prim.setAttribute("WEIGHTS_0", acc("VEC4", Float32Array.from(mesh.W)));
  prim.setIndices(acc("SCALAR", mesh.P.length / 3 > 65535 ? Uint32Array.from(mesh.I) : Uint16Array.from(mesh.I)));
  for (const mat of root.listMaterials())
    mat.setName("clay").setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setBaseColorFactor([0.86, 0.85, 0.83, 1]).setMetallicFactor(0).setRoughnessFactor(0.85);
  await doc.transform(prune());
  doc
    .createExtension(ALL_EXTENSIONS.find((e) => e.EXTENSION_NAME === "KHR_draco_mesh_compression"))
    .setRequired(true)
    .setEncoderOptions({ method: 1, quantizePosition: 14, quantizeNormal: 10 });
  const out = `${outDir}/colleague-${id}.glb`;
  await io.write(out, doc);
  console.log(`wrote ${out}: ${mesh.I.length / 3} triangles`);
}
