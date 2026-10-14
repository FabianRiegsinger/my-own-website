// Rigs the static T-pose mesh /me.glb onto the Mixamo skeleton layout of /figure.glb and exports a skinned GLB
// with the figure's clips retargeted (rotations only, hips height scaled). Runs in the browser via index.mjs.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clone as skClone } from "three/addons/utils/SkeletonUtils.js";

addEventListener("error", (e) => (window.__result = { error: e.error?.stack ?? e.message }));
addEventListener("unhandledrejection", (e) => (window.__result = { error: e.reason?.stack ?? String(e.reason) }));
const HEIGHT = 1.8; // m, matches the figure with its Memoji head
const log = (...a) => console.log(...a);
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("/draco/");
loader.setDRACOLoader(draco);

// ---------- source mesh ----------
const meGltf = await loader.loadAsync("/me.glb");
let geo;
meGltf.scene.traverse((o) => o.isMesh && !geo && (geo = o.geometry.clone().applyMatrix4(o.matrixWorld)));
geo.deleteAttribute("normal");
geo = mergeVertices(geo, 1e-5);
const pos0 = geo.attributes.position;
const idx0 = geo.index.array;

// Drop the hidden inner body (a second closed shell inside the clothes): keep components not enclosed by the largest.
{
  const n = pos0.count;
  const parent = new Int32Array(n).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
  for (let t = 0; t < idx0.length; t += 3) for (const k of [1, 2]) { const a = find(idx0[t]), b = find(idx0[t + k]); if (a !== b) parent[a] = b; }
  const comps = new Map();
  for (let i = 0; i < n; i++) { const r = find(i); const c = comps.get(r) ?? { n: 0, box: new T.Box3() }; c.n++; c.box.expandByPoint(new T.Vector3().fromBufferAttribute(pos0, i)); comps.set(r, c); }
  const sorted = [...comps.entries()].sort((a, b) => b[1].n - a[1].n);
  const main = sorted[0][1].box;
  const drop = new Set(sorted.slice(1).filter(([, c]) => c.n > 500 && main.containsBox(c.box) && c.box.max.z < main.max.z - 0.05).map(([r]) => r));
  log("components", sorted.length, "dropping", [...drop].map((r) => comps.get(r).n));
  const keep = [];
  for (let t = 0; t < idx0.length; t += 3) if (!drop.has(find(idx0[t]))) keep.push(idx0[t], idx0[t + 1], idx0[t + 2]);
  geo.setIndex(keep);
}

// Normalise: feet on the floor, centred, HEIGHT tall, facing +z.
geo.computeBoundingBox();
{
  const b = geo.boundingBox, s = HEIGHT / (b.max.y - b.min.y);
  geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  geo.scale(s, s, s);
  geo.computeBoundingBox();
}
const P = geo.attributes.position;
const N = P.count;
const X = (i) => P.getX(i), Y = (i) => P.getY(i), Z = (i) => P.getZ(i);
const all = [...Array(N).keys()];
const box = geo.boundingBox;
const maxX = box.max.x;

// ---------- landmarks ----------
const armVerts = all.filter((i) => Math.abs(X(i)) > 0.75 * maxX);
const armY = armVerts.reduce((a, i) => a + Y(i), 0) / armVerts.length;
const armR = (Math.max(...armVerts.map(Y)) - Math.min(...armVerts.map(Y))) / 2;
const slice = (y, h = 0.01, f = () => true) => all.filter((i) => Math.abs(Y(i) - y) < h && f(i));
const torsoHalf = Math.max(...slice(armY - 3 * armR, 0.01, (i) => Math.abs(X(i)) < 0.5 * maxX).map((i) => Math.abs(X(i))));
// Arm thickness along x: the wrist is the thinnest point in the outer part of the arm.
const thick = (x) => { const v = all.filter((i) => Math.abs(Math.abs(X(i)) - x) < 0.006 && Math.abs(Y(i) - armY) < 3 * armR); return v.length ? Math.max(...v.map(Y)) - Math.min(...v.map(Y)) : 1; };
let wristX = 0, best = 1;
for (let x = 0.6 * maxX; x < 0.85 * maxX; x += 0.004) { const t = thick(x); if (t < best) { best = t; wristX = x; } }
const shoulderX = torsoHalf * 0.85;
// Crotch: lowest point of the centre column that is still clothing above the gap between the legs.
const centre = all.filter((i) => Math.abs(X(i)) < 0.012 && Y(i) > 0.15 * HEIGHT && Y(i) < armY);
const crotchY = Math.min(...centre.map(Y));
// Neck: narrowest width between shoulders and head.
let neckY = armY, neckW = 1;
for (let y = armY + armR; y < armY + 0.3; y += 0.004) { const s = slice(y, 0.004, (i) => Math.abs(X(i)) < torsoHalf); if (!s.length) continue; const w = Math.max(...s.map((i) => Math.abs(X(i)))); if (w < neckW) { neckW = w; neckY = y; } }
const midZ = (y, h = 0.02, f = () => true) => { const s = slice(y, h, f); return s.length ? (Math.max(...s.map(Z)) + Math.min(...s.map(Z))) / 2 : 0; };
const legX = (() => { const s = slice(crotchY * 0.5, 0.01, (i) => X(i) > 0); return s.reduce((a, i) => a + X(i), 0) / s.length; })();
const toeZ = Math.max(...all.filter((i) => Y(i) < 0.04 && X(i) > 0).map(Z));
const heelZ = Math.min(...all.filter((i) => Y(i) < 0.04 && X(i) > 0).map(Z));
const land = { armY, armR, torsoHalf, wristX, shoulderX, crotchY, neckY, neckW, legX, toeZ, heelZ, top: box.max.y, maxX };
log("landmarks", JSON.stringify(Object.fromEntries(Object.entries(land).map(([k, v]) => [k, +v.toFixed(3)]))));

// ---------- skeleton (world positions, metres) ----------
const fig = await loader.loadAsync("/figure.glb");
let figMesh;
fig.scene.traverse((o) => o.isSkinnedMesh && !figMesh && (figMesh = o));
const src = figMesh.skeleton.bones;
src[0].scale.setScalar(1);
figMesh.skeleton.pose();
src[0].scale.setScalar(1);
// X Bot world positions relative to its hips, in metres (bones are cm under an 0.01 armature).
const ref = {};
for (const b of src) {
  const p = new T.Vector3();
  let o = b; while (o && o !== src[0]) { p.add(o.position); o = o.parent; }
  ref[b.name.replace("mixamorig", "")] = p.multiplyScalar(0.01);
}
const hipY = crotchY + 0.06;
const upLegY = hipY - 0.057 * (hipY / 1.04);
const footY = 0.095 * (hipY / 1.04);
const kneeY = (upLegY + footY) / 2;
const zAt = (y) => midZ(y, 0.02, (i) => Math.abs(X(i)) < torsoHalf);
const legZ = (y) => midZ(y, 0.02, (i) => X(i) > 0 && X(i) < torsoHalf);
const W = {};
W.Hips = new T.Vector3(0, hipY, zAt(hipY));
const spineFrac = { Spine: 0.221, Spine1: 0.441, Spine2: 0.639 };
const neckBase = neckY - 0.35 * (neckY - armY);
for (const [k, f] of Object.entries(spineFrac)) { const y = hipY + f * (neckBase - hipY); W[k] = new T.Vector3(0, y, zAt(y)); }
W.Neck = new T.Vector3(0, neckBase, zAt(neckBase));
W.Head = new T.Vector3(0, neckY + 0.02, zAt(neckY));
W.HeadTop_End = new T.Vector3(0, box.max.y, W.Head.z);
const headH = box.max.y - W.Head.y;
const frontZ = Math.max(...all.filter((i) => Y(i) > W.Head.y && Math.abs(X(i)) < 0.03).map(Z));
for (const s of [1, -1]) {
  const L = s > 0 ? "Left" : "Right";
  W[L + "Eye"] = new T.Vector3(0.18 * headH * s, W.Head.y + 0.45 * headH, frontZ - 0.03);
  const az = midZ(armY, 0.02, (i) => s * X(i) > shoulderX && s * X(i) < wristX);
  W[L + "Shoulder"] = new T.Vector3(0.3 * torsoHalf * s, armY + 0.3 * armR, zAt(armY));
  W[L + "Arm"] = new T.Vector3(shoulderX * s, armY, az);
  W[L + "ForeArm"] = new T.Vector3(((shoulderX + wristX) / 2) * s, armY, az);
  W[L + "Hand"] = new T.Vector3(wristX * s, armY, az);
  W[L + "UpLeg"] = new T.Vector3(legX * s, upLegY, legZ(upLegY));
  W[L + "Leg"] = new T.Vector3(legX * s, kneeY, legZ(kneeY));
  W[L + "Foot"] = new T.Vector3(legX * s, footY, heelZ + 0.35 * (toeZ - heelZ));
  W[L + "ToeBase"] = new T.Vector3(legX * s, 0.02, heelZ + 0.75 * (toeZ - heelZ));
  W[L + "Toe_End"] = new T.Vector3(legX * s, 0.02, toeZ);
}
// Fingers: X Bot's hand, scaled to this hand's length, from this wrist.
const handScale = (maxX - wristX) / (ref.LeftHandMiddle4 ? ref.LeftHandMiddle4.x - ref.LeftHand.x : 0.18);
for (const b of src) {
  const n = b.name.replace("mixamorig", "");
  if (W[n]) continue;
  const side = n.startsWith("Left") ? "Left" : "Right";
  const rel = ref[n].clone().sub(ref[side + "Hand"]).multiplyScalar(handScale);
  W[n] = W[side + "Hand"].clone().add(rel);
}

// Bones: same names and hierarchy, identity rest rotations, cm under an 0.01 armature (like the figure).
const armature = new T.Object3D();
armature.name = "Armature";
armature.scale.setScalar(0.01);
const bones = {};
for (const b of src) {
  const n = b.name.replace("mixamorig", "");
  const bone = new T.Bone();
  bone.name = b.name;
  bones[n] = bone;
  const pn = b.parent?.isBone ? b.parent.name.replace("mixamorig", "") : null;
  const parentW = pn ? W[pn] : new T.Vector3();
  bone.position.copy(W[n]).sub(parentW).multiplyScalar(100);
  (pn ? bones[pn] : armature).add(bone);
}

// ---------- skin weights ----------
const segs = {}; // bone -> [a, b] world segment
const seg = (n, to) => (segs[n] = [W[n], to ?? W[n]]);
seg("Hips", W.Spine); seg("Spine", W.Spine1); seg("Spine1", W.Spine2); seg("Spine2", W.Neck); seg("Neck", W.Head); seg("Head", W.HeadTop_End);
for (const L of ["Left", "Right"]) {
  seg(L + "Shoulder", W[L + "Arm"]); seg(L + "Arm", W[L + "ForeArm"]); seg(L + "ForeArm", W[L + "Hand"]);
  seg(L + "Hand", W[L + "Hand"].clone().setX(Math.sign(W[L + "Hand"].x) * maxX));
  seg(L + "UpLeg", W[L + "Leg"]); seg(L + "Leg", W[L + "Foot"]); seg(L + "Foot", W[L + "ToeBase"]); seg(L + "ToeBase", W[L + "Toe_End"]);
}
const segDist = (p, [a, b]) => { const ab = b.clone().sub(a), t = ab.lengthSq() ? T.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1) : 0; return p.distanceTo(a.clone().addScaledVector(ab, t)); };
const boneIndex = Object.fromEntries(src.map((b, i) => [b.name.replace("mixamorig", ""), i]));
const skinIndex = new Uint16Array(N * 4), skinWeight = new Float32Array(N * 4);
const p = new T.Vector3();
for (let i = 0; i < N; i++) {
  p.fromBufferAttribute(P, i);
  const side = p.x >= 0 ? "Left" : "Right";
  let cand;
  if (p.y > neckY + 0.03) cand = ["Head"];
  else if (Math.abs(p.x) > W[side + "Hand"].x * Math.sign(p.x) - 0.01 && Math.abs(p.y - armY) < 4 * armR) cand = [side + "Hand"];
  else if (Math.abs(p.x) > torsoHalf * 0.95 && Math.abs(p.y - armY) < 3 * armR) cand = [side + "Shoulder", side + "Arm", side + "ForeArm", "Spine2"];
  else if (p.y < crotchY + 0.01 && Math.abs(p.x) > 0.01) cand = [side + "UpLeg", side + "Leg", side + "Foot", side + "ToeBase", ...(p.y > crotchY - 0.08 ? ["Hips"] : [])];
  else cand = ["Hips", "Spine", "Spine1", "Spine2", "Neck", "Head", side + "Shoulder", side + "Arm", side + "UpLeg"];
  const w = cand.map((n) => [n, 1 / (segDist(p, segs[n]) ** 4 + 1e-7)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const sum = w.reduce((a, [, v]) => a + v, 0);
  w.forEach(([n, v], k) => { skinIndex[i * 4 + k] = boneIndex[n]; skinWeight[i * 4 + k] = v / sum; });
}

// ---------- regions for painting: 0 skin, 1 shirt, 2 trousers, 3 shoes, 4 hair, 5 dark, 6 forearm (skin, or a jacket sleeve) ----------
const region = new Uint8Array(N);
const shoeTop = footY + 0.035;
// Shirt hem: the shirt flares slightly just above where the torso narrows to the trousers.
let hemY = crotchY + 0.15, hemW = 0;
for (let y = crotchY + 0.08; y < crotchY + 0.32; y += 0.005) { const s = slice(y, 0.004, (i) => Math.abs(X(i)) < torsoHalf * 1.3); const w = s.length ? Math.max(...s.map((i) => Math.abs(X(i)))) : 0; if (w > hemW) { hemW = w; hemY = y; } }
// Sleeve hem: the steepest drop in arm thickness on the upper arm.
let sleeveX = shoulderX + 0.15, drop = 0;
for (let x = shoulderX + 0.06; x < (shoulderX + wristX) / 2 + 0.05; x += 0.01) { const d = thick(x) - thick(x + 0.02); if (d > drop) { drop = d; sleeveX = x + 0.01; } }
log("hem", hemY.toFixed(3), "sleeve", sleeveX.toFixed(3));

// Head: hair above a hairline that runs high at the front and low at the back; ears stay skin.
const headBase = neckY, headTop = box.max.y, hH = headTop - headBase;
const headV = all.filter((i) => Y(i) > headBase);
const hzMin = Math.min(...headV.map(Z)), hzMax = Math.max(...headV.filter((i) => Math.abs(X(i)) < 0.05).map(Z));
const smooth = (a, b, x) => { const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const n = geo.attributes.normal ?? (geo.computeVertexNormals(), geo.attributes.normal);
const eyeLo = headBase + 0.38 * hH, eyeHi = headBase + 0.68 * hH;
const axisZ = (hzMin + hzMax) / 2;
// Glasses: the modelled rims are fused into the face, so they cannot be painted cleanly; fit them and add real frames
// (below). Ridge score = how far a vertex stands out of its 1.5 cm neighbourhood along its normal.
const front = headV.filter((i) => Y(i) > eyeLo - 0.03 && Y(i) < eyeHi && Z(i) > axisZ + 0.02);
const cell = 0.015, grid = new Map();
const cellOf = (v) => Math.floor(v / cell);
for (const i of headV) { const k = [X(i), Y(i), Z(i)].map(cellOf).join(","); (grid.get(k) ?? grid.set(k, []).get(k)).push(i); }
const ridge = new Map();
for (const i of front) {
  const [gx, gy, gz] = [X(i), Y(i), Z(i)].map(cellOf);
  const m = new T.Vector3(); let c = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let e = -1; e <= 1; e++)
    for (const j of grid.get([gx + a, gy + b, gz + e].join(",")) ?? []) if (Math.hypot(X(j) - X(i), Y(j) - Y(i), Z(j) - Z(i)) < cell) { m.add(new T.Vector3(X(j), Y(j), Z(j))); c++; }
  m.divideScalar(c);
  ridge.set(i, new T.Vector3(X(i), Y(i), Z(i)).sub(m).dot(new T.Vector3().fromBufferAttribute(n, i)));
}
const ridges = front.filter((i) => ridge.get(i) > 0.002);
log("ridge verts", ridges.length, "of", front.length);
// One ellipse for both rims (glasses are symmetric): circle fit first, then refine Rx/Ry around it, on the ridge
// points of both sides mirrored to +x.
const pts = ridges.map((i) => [Math.abs(X(i)), Y(i), Z(i)]);
const score = (cx, cy, rx, ry) => { let sc = 0; for (const [x, y] of pts) if (Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry) < 0.005) sc++; return sc / Math.sqrt(Math.sqrt(rx * ry)); };
let fit = { cx: 0.1, cy: (eyeLo + eyeHi) / 2, rx: 0.06, ry: 0.06 }, fitScore = 0;
for (let cx = 0.05; cx <= 0.15; cx += 0.003) for (let cy = eyeLo; cy <= eyeHi; cy += 0.003) for (let r = 0.045; r <= 0.085; r += 0.003) {
  const sc = score(cx, cy, r, r); if (sc > fitScore) { fitScore = sc; fit = { cx, cy, rx: r, ry: r }; }
}
const c0 = { ...fit };
// Refine near the circle only, by raw support (normalising here would favour small ellipses).
let support = 0;
const count = (cx, cy, rx, ry) => { let sc = 0; for (const [x, y] of pts) if (Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry) < 0.004) sc++; return sc; };
for (let cx = c0.cx - 0.008; cx <= c0.cx + 0.008; cx += 0.002) for (let cy = c0.cy - 0.008; cy <= c0.cy + 0.008; cy += 0.002)
  for (let rx = c0.rx - 0.008; rx <= c0.rx + 0.008; rx += 0.002) for (let ry = c0.ry - 0.008; ry <= c0.ry + 0.008; ry += 0.002) {
    const sc = count(cx, cy, rx, ry); if (sc > support) { support = sc; fit = { cx, cy, rx, ry }; }
  }
// Rim plane: median depth of the ridge points on the fitted ellipse.
const onRim = pts.filter(([x, y]) => Math.abs(Math.hypot((x - fit.cx) / fit.rx, (y - fit.cy) / fit.ry) - 1) * Math.min(fit.rx, fit.ry) < 0.004).map(([, , z]) => z).sort((a, b) => a - b);
fit.z = onRim[Math.floor(onRim.length * 0.6)];
log("circle", JSON.stringify(c0), "rim ellipse", JSON.stringify(Object.fromEntries(Object.entries(fit).map(([k, v]) => [k, +v.toFixed(3)]))), "support", onRim.length);
for (let i = 0; i < N; i++) {
  const x = X(i), y = Y(i), z = Z(i);
  const dom = src[skinIndex[i * 4]].name.replace("mixamorig", "");
  if (y > headBase - 0.005 && dom === "Head") {
    const yf = (y - headBase) / hH, t = (z - hzMin) / (hzMax - hzMin);
    const ear = Math.abs(x) > 0.105 && yf > 0.28 && yf < 0.62 && t > 0.25 && t < 0.7;
    const hairline = 0.3 + 0.45 * smooth(0.45, 0.85, t);
    if (!ear && yf > hairline) region[i] = 4;
    else region[i] = 0;
  } else if (y < shoeTop) region[i] = 3;
  else if (/Hand/.test(dom)) region[i] = 0;
  else if (Math.abs(x) > sleeveX && Math.abs(y - armY) < 3 * armR) region[i] = 6; // forearms below the short sleeves
  else if (y < hemY && Math.abs(x) < torsoHalf * 1.3) region[i] = 2;
  else if (y > neckY - 0.01 && Math.abs(x) < neckW + 0.01) region[i] = 0;
  else region[i] = 1;
}

// Majority filter over mesh neighbours (3 passes): clean region borders (hairline, hem) and drop stray specks.
{
  const nb = Array.from({ length: N }, () => new Set());
  const ix = geo.index.array;
  for (let t = 0; t < ix.length; t += 3) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) { nb[ix[t + a]].add(ix[t + b]); nb[ix[t + b]].add(ix[t + a]); }
  for (let pass = 0; pass < 3; pass++) {
    const next = region.slice();
    for (let i = 0; i < N; i++) {
      const c = new Uint8Array(7);
      for (const j of nb[i]) c[region[j]]++;
      let best = region[i];
      for (let r = 0; r < 7; r++) if (c[r] > c[best]) best = r;
      if (c[best] > nb[i].size / 2) next[i] = best;
    }
    region.set(next);
  }
}

const g = new T.BufferGeometry();
g.setAttribute("position", P);
g.setIndex(geo.index);
g.setAttribute("skinIndex", new T.Uint16BufferAttribute(skinIndex, 4));
g.setAttribute("skinWeight", new T.Float32BufferAttribute(skinWeight, 4));
g.setAttribute("_region", new T.Float32BufferAttribute(Float32Array.from(region), 1));
g.computeVertexNormals();

const root = new T.Group();
root.name = "me";
root.add(armature);
root.updateMatrixWorld(true);
const ordered = src.map((b) => bones[b.name.replace("mixamorig", "")]);
const skeleton = new T.Skeleton(ordered);
const mesh = new T.SkinnedMesh(g, new T.MeshStandardMaterial({ color: "#cccccc" }));
mesh.name = "me-body";
root.add(mesh);
mesh.bind(skeleton);

// ---------- glasses: real frames on the head bone (the modelled rims are fused into the face) ----------
{
  const TUBE_R = 0.0055, FWD = 0.004;
  const z = fit.z + FWD;
  class Ellipse extends T.Curve {
    constructor(cx) { super(); this.cx = cx; }
    getPoint(t, out = new T.Vector3()) { const a = t * Math.PI * 2; return out.set(this.cx + fit.rx * Math.cos(a), fit.cy + fit.ry * Math.sin(a), z); }
  }
  const mat = new T.MeshStandardMaterial({ color: "#1f1f22", roughness: 0.35, metalness: 0.2 });
  const parts = [];
  for (const sg of [1, -1]) parts.push(new T.TubeGeometry(new Ellipse(sg * fit.cx), 96, TUBE_R, 10, true));
  // Bridge: a low arch between the inner tops of the rims.
  const a = (20 * Math.PI) / 180, bx = fit.cx - fit.rx * Math.cos(a), by = fit.cy + fit.ry * Math.sin(a);
  parts.push(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(bx, by, z), new T.Vector3(0, by + 0.012, z + 0.004), new T.Vector3(-bx, by, z)), 20, TUBE_R * 0.9, 8));
  // Temples: straight back from the outer edge of each rim, along the skull just in front of the ear (not out to the
  // ear flap's width, which made them stick out sideways from the front).
  const ty = fit.cy + 0.25 * fit.ry;
  const skull = Math.max(...headV.filter((i) => Math.abs(Y(i) - ty) < 0.01 && Z(i) > axisZ + 0.03 && Z(i) < axisZ + 0.07).map((i) => Math.abs(X(i))));
  const rimOuter = fit.cx + fit.rx;
  log("temples: rim outer", rimOuter.toFixed(3), "skull side", skull.toFixed(3));
  for (const sg of [1, -1]) {
    const start = new T.Vector3(sg * rimOuter, ty, z - 0.004);
    const mid = new T.Vector3(sg * (Math.max(rimOuter, skull) + 0.004), ty, (z + axisZ) / 2);
    const ear = new T.Vector3(sg * (skull + 0.004), ty - 0.004, axisZ - 0.005);
    parts.push(new T.TubeGeometry(new T.CatmullRomCurve3([start, mid, ear]), 24, TUBE_R * 0.75, 8));
  }
  // Eyes: a dark oval pupil with a catchlight on each eye, just on the eye surface inside the rim.
  const pupilMat = new T.MeshStandardMaterial({ color: "#2a1d16", roughness: 0.3 });
  const glintMat = new T.MeshBasicMaterial({ color: "#ffffff" });
  const eyeParts = [];
  for (const sg of [1, -1]) {
    const ex = sg * (fit.cx - 0.004), ey = fit.cy - 0.004;
    const near = front.filter((i) => Math.hypot(X(i) - ex, Y(i) - ey) < 0.01);
    const ez = near.length ? Math.max(...near.map(Z)) : fit.z - 0.02;
    const pupilG = new T.SphereGeometry(1, 20, 14).scale(0.0115, 0.015, 0.004).translate(ex, ey, ez + 0.001);
    const glintG = new T.SphereGeometry(1, 10, 8).scale(0.0035, 0.0035, 0.002).translate(ex + 0.004, ey + 0.006, ez + 0.0045);
    eyeParts.push([pupilG, pupilMat], [glintG, glintMat]);
  }
  const glassesGroup = new T.Group();
  glassesGroup.name = "glasses";
  for (const [g, m0] of [...parts.map((g) => [g, mat]), ...eyeParts]) { g.translate(-W.Head.x, -W.Head.y, -W.Head.z); const m = new T.Mesh(g, m0); m.name = "face-part"; glassesGroup.add(m); }
  glassesGroup.scale.setScalar(100); // bones are in cm under the 0.01 armature
  bones.Head.add(glassesGroup);
}

// ---------- clips: rotations only, hips position scaled to the new hip height ----------
const ratio = (hipY * 100) / 103.99;
const clips = fig.animations.map((c) => {
  const tracks = c.tracks.filter((t) => !t.name.endsWith(".scale") && (!t.name.endsWith(".position") || t.name === "mixamorigHips.position")).map((t) => {
    if (t.name !== "mixamorigHips.position") return t;
    const u = t.clone();
    for (let k = 0; k < u.values.length; k++) u.values[k] *= ratio;
    return u;
  });
  return new T.AnimationClip(c.name, c.duration, tracks);
});

// ---------- preview: idle frame, front and side ----------
const r = new T.WebGLRenderer({ antialias: true });
r.setSize(900, 700);
document.body.appendChild(r.domElement);
const scene = new T.Scene();
scene.background = new T.Color("#f4f4f6");
scene.add(new T.HemisphereLight("#fff", "#889", 1.3));
const dl = new T.DirectionalLight("#fff", 2); dl.position.set(1, 2, 3); scene.add(dl);
const colors = ["#f7d6bf", "#a9c6e8", "#2f3747", "#3a2c24", "#6e4b33", "#202020", "#f7d6bf"].map((c) => new T.Color(c));
const col = new Float32Array(N * 3); for (let i = 0; i < N; i++) colors[region[i]].toArray(col, i * 3);
const show = (clipName, x, ry, time) => {
  const c = skClone(root);
  const m = c.getObjectByName("me-body");
  m.geometry = g.clone(); m.geometry.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  m.material = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  if (clipName) { const mx = new T.AnimationMixer(c); mx.clipAction(clips.find((k) => k.name === clipName)).play(); mx.update(time); }
  c.position.x = x; c.rotation.y = ry; scene.add(c);
};
log("clips", clips.map((c) => c.name).join(","));
const names = clips.map((c) => c.name);
const ZOOM = new URLSearchParams(location.search).has("zoom") || window.ZOOM_HEAD;
if (ZOOM) {
  show(null, -0.36, 0); show(null, 0, 0.7); show(null, 0.36, Math.PI / 2);
} else {
  show(null, -2.4, 0);
  show(names[0], -0.8, 0, 0.5);
  show(names[1] ?? names[0], 0.8, 0.6, 0.3);
  show(names[2] ?? names[0], 2.4, -0.4, 0.8);
}
const cam = new T.PerspectiveCamera(30, 900 / 700, 0.1, 50);
if (ZOOM) { cam.position.set(0, 1.56, 1.5); cam.lookAt(0, 1.56, 0); } else { cam.position.set(0, 1.1, 9.5); cam.lookAt(0, 0.95, 0); }
r.render(scene, cam);

const glb = await new GLTFExporter().parseAsync(root, { binary: true, animations: clips });
const bytes = new Uint8Array(glb);
let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
window.__result = { land, verts: N, tris: g.index.count / 3, clips: clips.map((c) => c.name), glb: btoa(bin), screenshot: window.SHOT ?? null };
