// Converts the given characters of a font into three.js typeface JSON (for TextGeometry / drei Text3D).
// Usage: node scripts/make-typeface.mjs <font.woff|.ttf|.otf> <out.json> <chars>
// Needs opentype.js (npm install --no-save opentype.js); the font's licence must allow conversion (Inter: OFL).
import { readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";

const [input, output, chars] = process.argv.slice(2);
if (!input || !output || !chars) throw new Error("usage: make-typeface.mjs <font> <out.json> <chars>");

const buf = readFileSync(input);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const r = (n) => Math.round(n);

const glyphs = {};
for (const ch of new Set(chars)) {
  const g = font.charToGlyph(ch);
  // Raw glyph path is in font units, y up. typeface "o": q/b put the end point first, then the control points.
  const o = g.path.commands
    .map((c) => {
      if (c.type === "M") return `m ${r(c.x)} ${r(c.y)}`;
      if (c.type === "L") return `l ${r(c.x)} ${r(c.y)}`;
      if (c.type === "Q") return `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)}`;
      if (c.type === "C") return `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)}`;
      return "";
    })
    .filter(Boolean)
    .join(" ");
  const box = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(box.x1), x_max: r(box.x2), o };
}

const head = font.tables.head;
writeFileSync(
  output,
  JSON.stringify({
    glyphs,
    familyName: font.names.fontFamily.en,
    ascender: r(font.ascender),
    descender: r(font.descender),
    underlinePosition: r(font.tables.post.underlinePosition),
    underlineThickness: r(font.tables.post.underlineThickness),
    boundingBox: { xMin: head.xMin, yMin: head.yMin, xMax: head.xMax, yMax: head.yMax },
    resolution: font.unitsPerEm,
    original_font_information: { license: "SIL Open Font License 1.1 (see LICENSE-Inter.txt)" },
  }),
);
console.log(`${output}: ${Object.keys(glyphs).length} glyphs`);
