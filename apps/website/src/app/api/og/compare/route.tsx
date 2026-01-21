import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const contentType = "image/png";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const competitorName = searchParams.get("name");

  const hedvigSansFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSans/HedvigLettersSans-Regular.ttf",
  ).then((res) => res.arrayBuffer());

  const title = competitorName
    ? `${competitorName} Alternative`
    : "Compare Alternatives";

  const subtitle = competitorName
    ? `See why founders are switching from ${competitorName} to Midday`
    : "Built for founders, not accountants";

  return new ImageResponse(
    <div
      tw="h-full w-full flex flex-col bg-[#0C0C0C] p-16"
      style={{ fontFamily: "hedvig-sans" }}
    >
      {/* Header with logo */}
      <div tw="flex items-center mb-12">
        <svg width="40" height="40" viewBox="0 0 40 41" fill="white">
          <path d="M21.22 4.763a13.07 13.07 0 0 1 0 8.265l-.774 2.318 2.873-2.546a10.54 10.54 0 0 0 3.333-5.771l.815-3.982 2.477.507-.815 3.982a13.07 13.07 0 0 1-4.132 7.157l-1.832 1.624 3.763-.77a10.541 10.541 0 0 0 5.773-3.332l2.696-3.04 1.892 1.677-2.696 3.04a13.07 13.07 0 0 1-7.158 4.132l-2.4.49 3.645 1.216a10.54 10.54 0 0 0 6.666 0l3.855-1.285.799 2.398-3.855 1.285a13.069 13.069 0 0 1-8.264 0l-2.32-.774 2.547 2.874a10.537 10.537 0 0 0 5.772 3.33l3.98.817-.506 2.477-3.981-.815a13.069 13.069 0 0 1-7.158-4.132l-1.622-1.83.77 3.761a10.537 10.537 0 0 0 3.33 5.772l3.04 2.696-1.677 1.891-3.04-2.696a13.066 13.066 0 0 1-4.132-7.156l-.49-2.397-1.214 3.642a10.54 10.54 0 0 0 0 6.666l1.285 3.855-2.4.8-1.285-3.855a13.069 13.069 0 0 1 0-8.265l.773-2.324-2.873 2.55a10.542 10.542 0 0 0-3.332 5.773l-.815 3.98-2.476-.508.814-3.98a13.07 13.07 0 0 1 4.132-7.157l1.83-1.625-3.761.77A10.539 10.539 0 0 0 7.3 29.603l-2.697 3.04-1.891-1.677 2.696-3.04a13.066 13.066 0 0 1 7.156-4.133l2.398-.492-3.643-1.213a10.54 10.54 0 0 0-6.666 0L.8 23.372 0 20.973l3.855-1.285a13.069 13.069 0 0 1 8.264 0l2.32.773-2.547-2.872a10.539 10.539 0 0 0-5.772-3.333l-3.98-.815.506-2.476 3.981.814a13.069 13.069 0 0 1 7.158 4.133l1.62 1.828-.767-3.76a10.537 10.537 0 0 0-3.332-5.771l-3.04-2.696 1.677-1.894 3.04 2.696a13.069 13.069 0 0 1 4.133 7.158l.49 2.399 1.215-3.644a10.54 10.54 0 0 0 0-6.666l-1.284-3.854 2.398-.8 1.285 3.855ZM20 16.957a3.953 3.953 0 0 0-3.951 3.951l.021.404a3.951 3.951 0 0 0 7.86 0l.02-.404-.02-.404a3.952 3.952 0 0 0-3.526-3.525L20 16.957Z" />
        </svg>
      </div>

      {/* Main content */}
      <div tw="flex flex-col flex-1">
        <span tw="text-[#606060] text-xl mb-2">Compare</span>
        <span tw="text-white text-6xl font-bold mb-6">{title}</span>
        <span tw="text-[#878787] text-2xl mb-12 max-w-[800px]">{subtitle}</span>

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
    </div>,
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
    },
  );
}
