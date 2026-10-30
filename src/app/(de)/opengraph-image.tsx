import { ImageResponse } from "next/og";
import { cvDe as cv } from "@/content/cv.de";

export const alt = "Fabian Riegsinger — Agentischer Automobilingenieur";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f5f5f7", color: "#1d1d1f" }}>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>{cv.profile.name}</div>
        <div style={{ fontSize: 40, color: "#6e6e73", marginTop: 16 }}>{cv.profile.headline}</div>
        <div style={{ fontSize: 40, color: "#2563eb", marginTop: 48 }}>Agentischer Automobilingenieur</div>
      </div>
    ),
    size,
  );
}
