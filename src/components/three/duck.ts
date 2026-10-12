import { MathUtils } from "three";

const MARGIN = 40; // px of air between text and the nearest sphere
const FADE = 80; // px over which a sphere grows back to full size

/** Scale for a 3D object at screen x `px`: 0 over the text column, 1 once clear of it. `edge` null = no text to avoid. */
export function duckScale(px: number, edge: number | null) {
  return edge === null ? 1 : MathUtils.smoothstep(px, edge + MARGIN, edge + MARGIN + FADE);
}

/** Right edge (viewport px) of the visible content inside `root`: text glyphs plus empty decorative elements like level marks. */
export function contentRight(root: Element) {
  let right = 0;
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      if (!n.textContent?.trim()) continue;
      range.selectNodeContents(n);
      right = Math.max(right, range.getBoundingClientRect().right);
    } else if (!n.childNodes.length) {
      right = Math.max(right, (n as Element).getBoundingClientRect().right);
    }
  }
  return right;
}
