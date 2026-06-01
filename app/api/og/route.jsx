import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Founder";
  const subtitle = searchParams.get("subtitle") ?? "Verifizierte Gründer Community · Deutschland";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #101f5e 0%, #1a3aad 55%, #2f61df 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "white",
              color: "#1a3aad",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            F
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.95 }}>Founder</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, opacity: 0.88 }}>{subtitle}</div>
        </div>

        <div style={{ fontSize: 22, opacity: 0.75 }}>joinfounder.forum</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
