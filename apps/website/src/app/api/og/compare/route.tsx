import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const contentType = "image/png";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const competitorName = searchParams.get("name");

  const hedvigSansFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSans/HedvigLettersSans-Regular.ttf"
  ).then((res) => res.arrayBuffer());

  const title = competitorName
    ? `${competitorName} Alternative`
    : "Compare Alternatives";

  const subtitle = competitorName
    ? `See why founders are switching from ${competitorName} to Midday`
    : "Built for founders, not accountants";

  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col bg-[#0C0C0C] p-16"
        style={{ fontFamily: "hedvig-sans" }}
      >
        {/* Header with logo */}
        <div tw="flex items-center mb-12">
          <div tw="flex flex-col">
            <span tw="text-white text-3xl">midday</span>
          </div>
        </div>

        {/* Main content */}
        <div tw="flex flex-col flex-1">
          <span tw="text-[#606060] text-xl mb-2">Compare</span>
          <span tw="text-white text-6xl font-bold mb-6">{title}</span>
          <span tw="text-[#878787] text-2xl mb-12 max-w-[800px]">
            {subtitle}
          </span>

          {/* Features */}
          <div tw="flex mt-auto">
            <div tw="flex flex-col mr-16">
              <span tw="text-[#606060] text-lg mb-1">For</span>
              <span tw="text-white text-2xl">Founders</span>
            </div>

            <div tw="flex flex-col mr-16">
              <span tw="text-[#606060] text-lg mb-1">Interface</span>
              <span tw="text-white text-2xl">Modern</span>
            </div>

            <div tw="flex flex-col mr-16">
              <span tw="text-[#606060] text-lg mb-1">AI</span>
              <span tw="text-white text-2xl">Built-in</span>
            </div>

            <div tw="flex flex-col">
              <span tw="text-[#606060] text-lg mb-1">Trial</span>
              <span tw="text-white text-2xl">14 days free</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "hedvig-sans",
          data: await hedvigSansFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
