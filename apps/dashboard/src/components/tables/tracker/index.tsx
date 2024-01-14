import { ExportButton } from "@/components/export-button";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/tracker/data-table";
import { getUser } from "@midday/supabase/cached-queries";
import { getPagination } from "@midday/supabase/queries";
// import { NoResults } from "./empty-states";
// import { Loading } from "./loading";

const pageSize = 50;

export async function Table({ page, sort, initialTrackerId }) {
  const { to, from } = getPagination(page, pageSize);
  const { data: userData } = await getUser();
  const { data, meta } = {
    meta: null,
    data: [
      {
        id: "1",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
      },
      {
        id: "2",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
      },
      {
        id: "3",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
      },
      {
        id: "4",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
      },
      {
        id: "5",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "completed",
      },
      {
        id: "6",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
      },
    ],
  };

  //   if (!data?.length) {
  //     return <NoResults hasFilters={hasFilters} />;
  //   }

  const hasNextPage = meta?.count / (page + 1) > pageSize;

  return (
    <div className="relative">
      <DataTable
        data={data}
        teamId={userData.team_id}
        initialTrackerId={initialTrackerId}
      />

      <Pagination
        page={page}
        count={meta?.count}
        to={to}
        from={from}
        hasNextPage={hasNextPage}
        className="mt-4"
      />
    </div>
  );
}
