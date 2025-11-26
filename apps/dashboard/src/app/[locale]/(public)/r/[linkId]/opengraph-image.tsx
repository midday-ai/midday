import { getChartDisplayName } from "@/components/metrics/utils/chart-types";
import { getQueryClient, trpc } from "@/trpc/server";
import { isValidLogoUrl } from "@midday/invoice";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

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

  // Load Hedvig Letters Sans font from Google Fonts
  const hedvigSansFont = fetch(
    "https://fonts.gstatic.com/s/hedvigletterssans/v2/CHy_V_PfGVjobSBkihHWDT98RVp37w8jcOZH3B4jm11gRA.woff2",
  ).then((res) => res.arrayBuffer());

  const chartName = getChartDisplayName(report.type as any);
  const fromDate = new Date(report.from!);
  const toDate = new Date(report.to!);
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

        {/* Shared Report Badge */}
        <div tw="flex px-4 py-1 rounded-full bg-[#292928] text-[#F5F5F3] text-[22px]">
          <span tw="font-sans">Shared Report</span>
        </div>
      </div>

      {/* Content */}
      <div tw="flex flex-col flex-1 justify-center items-center">
        {/* Company Name */}
        <h1 tw="text-[56px] text-white font-sans mb-8 text-center">
          {teamName}
        </h1>

        {/* Report Type */}
        <h2 tw="text-[42px] text-white font-sans mb-6 text-center">
          {chartName}
        </h2>

        {/* Date Range */}
        <p tw="text-[28px] text-[#858585] font-sans text-center">
          {dateRangeDisplay}
        </p>
      </div>

      {/* Footer */}
      <div tw="flex justify-center mt-auto">
        <p tw="text-[20px] text-[#858585] font-sans">
          Powered by <span tw="text-white">Midday</span>
        </p>
      </div>
    </div>
  );
}
