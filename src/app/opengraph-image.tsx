import { ImageResponse } from "next/og";
import { cv } from "@/content/cv";

export const alt = "Fabian Riegsinger — Automotive Engineer → Agentic Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundImage: "linear-gradient(160deg, #0b1033 0%, #1a1f5e 55%, #2a1e5c 100%)", color: "#ffffff" }}>
        <div style={{ fontSize: 92, fontWeight: 800 }}>{cv.profile.name}</div>
        <div style={{ fontSize: 38, color: "#aeb6e8", marginTop: 16 }}>{cv.profile.headline}</div>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 36, fontWeight: 800, marginTop: 48, padding: "14px 32px", borderRadius: 999, background: "#2ee6a6", color: "#0b1033" }}>Automotive engineer → agentic builder</div>
      </div>
    ),
    size,
  );
}
