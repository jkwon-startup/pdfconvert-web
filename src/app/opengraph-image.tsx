import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "여행가J의 PPT, PDF convert — BYO API Key";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #fafafa 0%, #f4f4f5 50%, #fef3c7 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#52525b",
            fontSize: "22px",
            fontWeight: 500,
          }}
        >
          <span>여행가J의 PPT</span>
          <span style={{ color: "#171717" }}>·</span>
          <span>PDF convert</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#fafafa",
              fontSize: "22px",
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: "999px",
              background: "#0a0a0a",
              alignSelf: "flex-start",
            }}
          >
            여행가J의
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "96px",
              fontWeight: 800,
              color: "#0a0a0a",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            <span>PPT, PDF를</span>
            <span style={{ color: "#a16207" }}>마크다운으로</span>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#52525b",
            fontSize: "22px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontWeight: 600, color: "#171717" }}>
              Claude · Gemini · GPT
            </span>
            <span style={{ fontSize: "18px" }}>
              우리 서버 거치지 않고 · 100% 무료 · 오픈소스
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              borderRadius: "12px",
              background: "#0a0a0a",
              color: "#fafafa",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            pdfconvert-web.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
