import { ImageResponse } from "next/og";

export const alt = "Eatofine Admin";
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
          background: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #10b981 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            background: "white",
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          }}
        >
          <span
            style={{
              fontSize: 110,
              fontWeight: 900,
              color: "#047857",
            }}
          >
            E
          </span>
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -1 }}>
          Eatofine Admin
        </div>
        <div style={{ fontSize: 28, opacity: 0.8, marginTop: 12 }}>
          Multi-vendor food delivery platform
        </div>
      </div>
    ),
    { ...size },
  );
}
