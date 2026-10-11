import { ImageResponse } from "next/og";
import { cv } from "@/content/cv";

export const alt = "Fabian Riegsinger — Automotive Engineer → Agentic Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f4f1ea", color: "#000000", border: "12px solid #000" }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, textTransform: "uppercase" }}>{cv.profile.name}</div>
        <div style={{ fontSize: 34, marginTop: 16, textTransform: "uppercase" }}>{cv.profile.headline}</div>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 40, fontWeight: 700, marginTop: 48, padding: "12px 24px", background: "#ffe500", border: "6px solid #000", boxShadow: "12px 12px 0 #000", textTransform: "uppercase" }}>Automotive engineer → agentic builder</div>
      </div>
    ),
    size,
  );
}
