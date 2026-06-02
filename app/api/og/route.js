import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

const GEORGIA_FONT_URL = "https://fonts.gstatic.com/s/tinos/v24/biGmjGhyZmXP60Ac.ttf";

export async function GET() {
  const fontData = await fetch(GEORGIA_FONT_URL).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3aad",
          color: "#ffffff",
          fontFamily: "Georgia",
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        Founder
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Georgia",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
