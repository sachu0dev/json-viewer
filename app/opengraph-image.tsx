import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, display: "flex" }}>{"{ } JSON Viewer"}</div>
        <div style={{ fontSize: 28, color: "#a3a3a3", marginTop: 20, display: "flex" }}>
          Paste, Diff, and Inspect JSON in Your Browser
        </div>
      </div>
    ),
    size,
  );
}
