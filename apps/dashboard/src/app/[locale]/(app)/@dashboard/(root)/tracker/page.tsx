import { OpenTracker } from "@/components/open-tracker";
import { Table } from "@/components/tables/tracker";
import { TrackerGraph } from "@/components/tracker-graph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
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

export default function Tracker() {
  return (
    <div>
      <TrackerGraph data={records} />

      <div className="mt-14 mb-6 flex items-center justify-between">
        <h2 className="text-xl">Projects</h2>
        <div className="flex space-x-2">
          <Select>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <OpenTracker />
          </div>
        </div>
      </div>

      <Suspense>
        <Table />
      </Suspense>
    </div>
  );
}
