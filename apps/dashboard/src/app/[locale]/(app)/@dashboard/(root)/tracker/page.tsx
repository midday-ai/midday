import { OpenTracker } from "@/components/open-tracker";
import { SearchField } from "@/components/search-field";
import { Table } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerChangeStatus } from "@/components/tracker-change-status";
import { TrackerGraph } from "@/components/tracker-graph";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

const records = {
  "2023-07-04": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2023-08-12": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2023-10-12": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2023-11-21": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-01": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-08": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-09": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-13": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
    {
      id: "2",
      description: "Design",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
        avatar_url:
          "https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg",
      },
    },
    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-14": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
  "2024-01-15": [
    {
      id: "1",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        working: true,
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },

    {
      id: "3",
      description: "Development",
      time: 1,
      user: {
        id: "1",
        full_name: "Pontus Abrahamsson",
        avatar_url:
          "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
      },
    },
  ],
};

export default function Tracker({ searchParams }) {
  const status = searchParams?.status;
  const initialTrackerId = searchParams?.id;
  const sort = searchParams?.sort?.split(":");

  return (
    <div>
      <TrackerGraph data={records} />

      <div className="mt-14 mb-6 flex items-center justify-between">
        <SearchField placeholder="Search projects" />
        <div className="flex space-x-2">
          <TrackerChangeStatus />
          <OpenTracker />
        </div>
      </div>

      <Suspense key={`${status}-${status}`} fallback={<Loading />}>
        <Table
          status={status}
          sort={sort}
          initialTrackerId={initialTrackerId}
          query={searchParams?.q}
        />
      </Suspense>
    </div>
  );
}
