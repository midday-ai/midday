"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter } from "next/navigation";
import { useState } from "react";

const records = {
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
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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
    {
      id: "2",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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
      id: "2",
      description: "Development",
      time: 7,
      user: {
        id: "1",
        full_name: "Viktor Hofte",
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

export function TrackerWidget() {
  const router = useRouter();
  const [currentDate, setDate] = useState(new Date().toString());

  const onSelect = ({ id, date }) => {
    router.push(`/tracker?id=${id}&date=${date}`);
  };

  return (
    <TrackerMonthGraph
      disableButton
      date={currentDate}
      onSelect={onSelect}
      records={records}
    />
  );
}
