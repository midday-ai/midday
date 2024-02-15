import { TrackerGraph } from "@/components/tracker-graph";
import { createClient } from "@midday/supabase/server";
import { notFound } from "next/navigation";

export const revalidate = 3600;

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

  const { data, error } = await supabase
    .from("tracker_reports")
    .select("*, project:project_id(id, name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return notFound();
  }

  return (
    <div className="h-screen flex flex-col pl-4 pr-4">
      <div className="flex items-center justify-center w-full h-[80px] border-b-[1px]">
        <div className="flex items-center flex-col">
          <div>{data.project.name}</div>
          <span className="text-[#878787]">Time Report</span>
        </div>
      </div>

      <div className="justify-center w-full flex px-8 h-full mt-6">
        <div className="max-w-[1400px]">
          <TrackerGraph
            date={searchParams?.date}
            projectId={data.project.id}
            isTracking
          />
        </div>
      </div>

      <footer className="flex items-center justify-center w-full mt-auto h-[80px]">
        <div>
          <p className="text-[#878787] text-sm">
            Powered by{" "}
            <a
              href="https://midday.ai?utm_source=project"
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
