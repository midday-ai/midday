import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { FormatAmount } from "@/components/format-amount";
import {
  getBurnRateQuery,
  getCurrentBurnRateQuery,
  getMetricsQuery,
} from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Button } from "@midday/ui/button";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const fetchCache = "force-cache";

function getReportMeta(data) {
  const period = `${format(new Date(data.from), "LLL dd, y")} - ${format(
    new Date(data.to),
    "LLL dd, y"
  )}`;

  switch (data.type) {
    case "profit":
      return {
        title: `Profit for ${data.team.name} (${period})`,
        description: `Profit for ${data.team.name} based on the period ${period}`,
        shortTitle: "Profit",
      };
    case "revenue":
      return {
        title: `Revenue for ${data.team.name} (${period})`,
        description: `Revenue for ${data.team.name} based on the period ${period}`,
        shortTitle: "Revenue",
      };
    case "burn_rate":
      return {
        title: `Burn rate for ${data.team.name} (${period})`,
        description: `Burn rate for ${data.team.name} based on the period ${period}`,
        shortTitle: "Burn rate",
      };

    default:
      return {};
  }
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createClient({ admin: true });

  const { data, error } = await supabase
    .from("reports")
    .select("*, team:team_id(name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return {};
  }

  return {
    ...getReportMeta(data),
    robots: {
      index: false,
    },
  };
}

export default async function Report({ params }) {
  const supabase = createClient({ admin: true });

  const { data, error } = await supabase
    .from("reports")
    .select("*, team:team_id(name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return notFound();
  }

  async function getContent() {
    switch (data.type) {
      case "profit":
      case "revenue": {
        const metricsData = await getMetricsQuery(supabase, {
          teamId: data.team_id,
          from: data.from,
          to: data.to,
          type: data.type,
          currency: data.currency,
        });

        return (
          <>
            <div className="flex flex-col space-y-2 items-start mb-16">
              <div>
                <h1 className="text-4xl font-mono">
                  <FormatAmount
                    amount={metricsData.summary.currentTotal}
                    currency={metricsData.summary.currency}
                  />
                </h1>
              </div>
              <div className="text-[#878787]">
                {format(new Date(data.from), "LLL dd, y")} -{" "}
                {format(new Date(data.to), "LLL dd, y")}
              </div>
            </div>

            <BarChart data={metricsData} currency={data.currency} />
          </>
        );
      }
      case "burn_rate": {
        const [{ data: burnRateData }, { data: currentBurnRateData, error }] =
          await Promise.all([
            getBurnRateQuery(supabase, {
              teamId: data.team_id,
              from: data.from,
              to: data.to,
              type: data.type,
              currency: data.currency,
            }),
            getCurrentBurnRateQuery(supabase, {
              teamId: data.team_id,
              from: data.from,
              to: data.to,
              type: data.type,
              currency: data.currency,
            }),
          ]);

        return (
          <>
            <div className="flex flex-col space-y-2 items-start mb-16">
              <div>
                <h1 className="text-4xl font-mono">
                  <FormatAmount
                    amount={currentBurnRateData ?? 0}
                    currency={data.currency}
                  />
                </h1>
              </div>
              <div className="text-[#878787]">
                {format(new Date(data.from), "LLL dd, y")} -{" "}
                {format(new Date(data.to), "LLL dd, y")}
              </div>
            </div>
            <AreaChart currency={data.currency} data={burnRateData} />
          </>
        );
      }
      default:
        break;
    }
  }

  return (
    <div className="h-screen flex flex-col pl-4 pr-4">
      <div className="flex items-center justify-center w-full h-[80px] border-b-[1px]">
        <div className="flex items-center flex-col">
          <div>{data.team.name}</div>
          <span className="text-[#878787]">
            {getReportMeta(data)?.shortTitle}
          </span>
        </div>

        <Link href="/" className="absolute right-4">
          <Button variant="outline">Sign up</Button>
        </Link>
      </div>

      <div className="justify-center items-center w-full flex mt-[60px] md:mt-[180px]">
        <div className="w-[1200px]">{getContent()}</div>
      </div>

      <footer className="flex items-center justify-center w-full mt-auto h-[80px]">
        <div>
          <p className="text-[#878787] text-sm">
            Powered by{" "}
            <a
              href="https://midday.ai?utm_source=report"
              className="text-black dark:text-white"
            >
              Midday
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
