import { DataTable } from "@/components/tables/tracker/data-table";
import { getUser } from "@midday/supabase/cached-queries";

const pageSize = 50;

export async function Table({ page, initialTrackerId, records }) {
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
        members: [
          {
            id: "1",
            full_name: "Viktor Hofte",
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
        ],
      },
      {
        id: "2",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
        members: [
          {
            id: "1",
            full_name: "Pontus Abrahamsson",
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
          {
            id: "1",
            full_name: "Viktor Hofte",
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
          {
            id: "1",
            full_name: "Viktor Hofte",
            working: true,
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
        ],
      },
      {
        id: "3",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
        members: [
          {
            id: "1",
            full_name: "Viktor Hofte",
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
        ],
      },
      {
        id: "4",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "in_progress",
        members: [
          {
            id: "1",
            full_name: "Viktor Hofte",
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
        ],
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
        members: [
          {
            id: "1",
            full_name: "Viktor Hofte",
            working: true,
            avatar_url:
              "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
          },
        ],
      },
      {
        id: "6",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "completed",
      },
      {
        id: "7",
        name: "Project X",
        time: 85,
        description: "Product Design",
        status: "completed",
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
        records={records}
      />
    </div>
  );
}
