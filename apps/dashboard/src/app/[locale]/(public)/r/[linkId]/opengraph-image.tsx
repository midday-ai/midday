import { isValidLogoUrl } from "@midday/invoice";
import { format, parseISO } from "date-fns";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getChartDisplayName } from "@/components/metrics/utils/chart-types";
import { getQueryClient, trpc } from "@/trpc/server";

export const contentType = "image/png";

// Cache the OG image for 1 hour (3600 seconds)
export const revalidate = 3600;

type Props = {
  params: Promise<{ linkId: string }>;
};

export default async function Image({ params }: Props) {
  const { linkId } = await params;

  const queryClient = getQueryClient();

  const report = await queryClient.fetchQuery(
    trpc.reports.getByLinkId.queryOptions({ linkId }),
  );

  if (!report) {
    notFound();
  }

  // Check if report has expired
  if (report.expireAt && new Date(report.expireAt) < new Date()) {
    notFound();
  }

  const hedvigSerifFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSerif/HedvigLettersSerif-Regular.ttf?c=1",
  ).then((res) => res.arrayBuffer());

  const hedvigSansFont = fetch(
    "https://cdn.midday.ai/fonts/HedvigSans/HedvigLettersSans-Regular.ttf",
  ).then((res) => res.arrayBuffer());

  const chartName = getChartDisplayName(report.type as any);
  const fromDate = parseISO(report.from!);
  const toDate = parseISO(report.to!);
  const dateRangeDisplay = `${format(fromDate, "MMM d")} - ${format(
    toDate,
    "MMM d, yyyy",
  )}`;

  const teamName = report.teamName || "Company";
  const logoUrl = report.teamLogoUrl;
  const isValidLogo = logoUrl ? await isValidLogoUrl(logoUrl) : false;

  return new ImageResponse(
    <ReportOgTemplate
      teamName={teamName}
      chartName={chartName}
      dateRangeDisplay={dateRangeDisplay}
      logoUrl={logoUrl}
      isValidLogo={isValidLogo}
    />,
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
        {
          name: "hedvig-serif",
          data: await hedvigSerifFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}

function ReportOgTemplate({
  teamName,
  chartName,
  dateRangeDisplay,
  logoUrl,
  isValidLogo,
}: {
  teamName: string;
  chartName: string;
  dateRangeDisplay: string;
  logoUrl?: string | null;
  isValidLogo: boolean;
}) {
  return (
    <div tw="h-full w-full flex flex-col bg-[#0C0C0C] font-sans p-16 py-8">
      {/* Header */}
      <div tw="flex mb-12 items-center justify-between w-full">
        {/* Logo/Avatar */}
        {isValidLogo && logoUrl ? (
          <img
            src={logoUrl}
            alt={teamName}
            tw="w-16 h-16 border-[0.5px] border-[#2D2D2D] rounded-full overflow-hidden"
          />
        ) : (
          <div tw="w-16 h-16 rounded-full border-[0.5px] border-[#2D2D2D] bg-[#1C1C1C] text-[#F2F2F2] flex items-center justify-center text-[32px]">
            {teamName[0]?.toUpperCase() || "C"}
          </div>
        )}
      </div>

      {/* Content */}
      <div tw="flex flex-col flex-1 justify-center items-center">
        {/* Report Type */}
        <h1
          tw="text-[80px] text-white mb-6 text-center"
          style={{ fontFamily: "hedvig-serif" }}
        >
          {chartName}
        </h1>

        {/* Company Name */}
        <h2
          tw="text-[36px] text-white mb-8 text-center"
          style={{ fontFamily: "hedvig-sans" }}
        >
          {teamName}
        </h2>

        {/* Date Range */}
        <p
          tw="text-[28px] text-[#858585] text-center"
          style={{ fontFamily: "hedvig-sans" }}
        >
          {dateRangeDisplay}
        </p>
      </div>
    </div>
  );
}
