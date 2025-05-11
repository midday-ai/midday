"use client";

import { useUserQuery } from "@/hooks/use-user";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import React from "react";

type ActivityItemProps = {
  label: string;
  date: string;
  completed: boolean;
  isLast?: boolean;
  timeFormat?: number | null;
};

function ActivityItem({
  label,
  date,
  completed,
  isLast,
  timeFormat,
}: ActivityItemProps) {
  return (
    <li className="relative pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-[3px] top-[20px] bottom-0 border-[0.5px] border-border" />
      )}

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative z-10 flex size-[7px] items-center justify-center rounded-full border border-border",
            completed && "bg-[#666666] border-[#666666]",
          )}
        />

        <div className="flex flex-1 items-center justify-between">
          <span
            className={cn(
              "text-sm",
              completed ? "text-primary" : "text-[#666666]",
            )}
          >
            {label}
          </span>

          <span className="text-sm text-[#666666]">
            {date &&
              format(
                new Date(date),
                `MMM d, ${timeFormat === 24 ? "HH:mm" : "h:mm a"}`,
              )}
          </span>
        </div>
      </div>
    </li>
  );
}

type Props = {
  data: RouterOutputs["invoice"]["getById"];
};

export function InvoiceActivity({ data }: Props) {
  const { data: user } = useUserQuery();
  const completed = data?.paid_at !== null;

  return (
    <ul>
      {data?.created_at && (
        <ActivityItem
          label="Created"
          date={data?.created_at}
          completed
          timeFormat={user?.time_format}
        />
      )}

      {data?.scheduled_at && (
        <ActivityItem
          label="Scheduled"
          date={data?.scheduled_at}
          completed
          timeFormat={user?.time_format}
        />
      )}
      {data?.sent_at && (
        <ActivityItem
          label="Sent"
          date={data?.sent_at}
          completed
          timeFormat={user?.time_format}
        />
      )}
      {data?.viewed_at && (
        <ActivityItem
          label="Viewed"
          date={data?.viewed_at}
          completed
          timeFormat={user?.time_format}
        />
      )}
      {data?.reminder_sent_at && (
        <ActivityItem
          label="Reminder sent"
          date={data?.reminder_sent_at}
          completed
          timeFormat={user?.time_format}
        />
      )}

      {data?.status !== "canceled" && (
        <ActivityItem
          label="Paid"
          date={data?.paid_at}
          completed={completed}
          isLast
          timeFormat={user?.time_format}
        />
      )}

      {data?.status === "canceled" && (
        <ActivityItem
          label="Canceled"
          completed
          date={data?.updated_at}
          isLast
          timeFormat={user?.time_format}
        />
      )}
    </ul>
  );
}
