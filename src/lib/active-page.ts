/** The page (section id) under the middle of the viewport: `centerY` and `sections` in document coordinates, page order. */
export function activeSection(centerY: number, sections: { id: string; top: number; height: number }[]): string | null {
  if (sections.length === 0) return null;
  return (sections.find((s) => centerY < s.top + s.height) ?? sections[sections.length - 1]).id;
}
