import { TrackerGraph } from "@/components/tracker-graph/tracker-graph";
import { getTrackerRecordsByRangeQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Button } from "@midday/ui/button";
import { endOfMonth, formatISO, startOfMonth, subMonths } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";

export const revalidate = 3600;
export const fetchCache = "force-cache";

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createClient({ admin: true });

  const { data, error } = await supabase
    .from("tracker_reports")
    .select("*, project:project_id(name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return {};
  }

  return {
    title: `Time Report for ${data.project.name}`,
    robots: {
      index: false,
    },
  };
}

export default async function ProjectReport({ params, searchParams }) {
  const supabase = createClient({ admin: true });
  const date = searchParams?.date;
  const currentDate = date ? new Date(date) : new Date();
  const numberOfMonths = 6;
  const start = startOfMonth(subMonths(currentDate, numberOfMonths));
  const end = endOfMonth(currentDate);

  const { data: reportData, error } = await supabase
    .from("tracker_reports")
    .select(
      "*, project:project_id(id, name), user:created_by(week_starts_on_monday)"
    )
    .eq("id", params.id)
    .single();

  const { data, meta } = await getTrackerRecordsByRangeQuery(supabase, {
    projectId: reportData.project.id,
    teamId: reportData.team_id,
    from: formatISO(start, {
      representation: "date",
    }),
    to: formatISO(end, {
      representation: "date",
    }),
  });

  if (error) {
    return notFound();
  }

  return (
    <div className="h-screen flex flex-col pl-4 pr-4">
      <div className="flex items-center justify-center w-full h-[80px] border-b-[1px]">
        <div className="flex items-center flex-col">
          <div>{reportData.project.name}</div>
          <span className="text-[#878787]">Time Report</span>
        </div>

        <Link href="/" className="absolute right-4" prefetch>
          <Button variant="outline">Sign up</Button>
        </Link>
      </div>

      <div className="justify-center w-full flex px-8 h-full mt-6">
        <div className="max-w-[1400px]">
          <TrackerGraph
            data={data}
            meta={meta}
            date={currentDate}
            start={start}
            end={end}
            numberOfMonths={numberOfMonths}
            projectId={reportData.project.id}
            weekStartsOn={reportData?.user?.week_starts_on_monday && 1}
          />
        </div>
      </div>

      <footer className="flex items-center justify-center w-full mt-auto h-[80px]">
        <div>
          <p className="text-[#878787] text-sm">
            Powered by{" "}
            <a
              href="https://solomon-ai.app?utm_source=project"
              className="text-black dark:text-white"
            >
              Solomon AI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
