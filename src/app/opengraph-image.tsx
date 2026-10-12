import { ImageResponse } from "next/og";
import { cv } from "@/content/cv";

export const alt = "Fabian Riegsinger — Automotive Engineer → Agentic Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#ffffff", color: "#111111", borderTop: "16px solid #111111" }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -5, lineHeight: 0.9 }}>{cv.profile.name}</div>
        <div style={{ fontSize: 40, color: "#555555", marginTop: 16 }}>{cv.profile.headline}</div>
        <div style={{ fontSize: 40, color: "#e10600", marginTop: 48 }}>Automotive engineer → agentic builder</div>
      </div>
    ),
    size,
  );
}
