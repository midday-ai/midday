import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChartDisplayName } from "@/components/metrics/utils/chart-types";
import { PublicMetricView } from "@/components/public-metric-view";
import { getQueryClient, trpc } from "@/trpc/server";

// Cache the page for 1 hour (3600 seconds)
export const revalidate = 3600;

type Props = {
  params: Promise<{ linkId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { linkId } = await params;
  const queryClient = getQueryClient();

  const report = await queryClient.fetchQuery(
    trpc.reports.getByLinkId.queryOptions({ linkId }),
  );

  if (!report) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const chartName = getChartDisplayName(report.type as any);
  const teamName = report.teamName || "Company";

  return {
    title: `${teamName} - ${chartName}`,
    description: `Shared ${chartName} report from ${teamName}`,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `${teamName} - ${chartName}`,
      description: `Shared ${chartName} report from ${teamName}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${teamName} - ${chartName}`,
      description: `Shared ${chartName} report from ${teamName}`,
    },
  };
}

export default async function Page({ params }: Props) {
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

  const chartName = getChartDisplayName(report.type as any);
  const fromDate = parseISO(report.from!);
  const toDate = parseISO(report.to!);
  const dateRangeDisplay = `${format(fromDate, "MMM d")} - ${format(
    toDate,
    "MMM d, yyyy",
  )}`;

  const teamName = report.teamName || "Company";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex-shrink-0">
              <Icons.LogoSmall className="h-6 w-auto" />
            </div>

            {/* Company Name - Center */}
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-sm">{teamName}</h1>
            </div>

            {/* Login Button - Right */}
            <div className="flex-shrink-0">
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Full width with max width */}
      <main className="flex-1 max-w-[1600px] mx-auto px-4 md:px-8 py-8 w-full flex items-center justify-center">
        <div className="w-full max-w-7xl">
          <PublicMetricView
            report={report}
            chartName={chartName}
            dateRangeDisplay={dateRangeDisplay}
          />
        </div>
      </main>

      {/* Footer - Powered by */}
      <footer className="mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
          <p className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://midday.ai"
              className="hover:text-foreground transition-colors"
            >
              Midday
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
