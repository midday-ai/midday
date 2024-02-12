"use client";

import { useTrackerStore } from "@/store/tracker";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { cn } from "@midday/ui/utils";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  formatISO,
  isSameDay,
  startOfMonth,
} from "date-fns";

export function TrackerMonthGraph({
  date,
  onSelect,
  data,
  showCurrentDate,
  projectId,
  disableHover,
  disableButton,
}) {
  const { isTracking } = useTrackerStore();

  const result = eachDayOfInterval({
    start: startOfMonth(new Date(date)),
    end: endOfMonth(new Date(date)),
  });

  const handleOnSelect = (params) => {
    if (onSelect) {
      onSelect({
        projectId: params.id || projectId,
        date: formatISO(params.date, { representation: "date" }),
      });
    }
  };

  const rows = result.map((day, i) => {
    const isoDate = formatISO(day, { representation: "date" });
    const isActive = showCurrentDate && isoDate === date;
    const records = data && data[isoDate];

    const totalDuration = records?.reduce(
      (duration, item) => item.duration + duration,
      0
    );

    return (
      <HoverCard key={i.toString()} openDelay={250} closeDelay={150}>
        <HoverCardTrigger asChild>
          <button
            className="w-[35px] flex items-center justify-center group relative"
            type="button"
            onClick={() => handleOnSelect({ date: day })}
            disabled={disableButton}
          >
            <div
              className={cn(
                "w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white transition-colors",
                isActive && "border-white"
              )}
            >
              <div
                className={cn(
                  "w-[20px] h-[20px] rounded-full bg-[#878787]/30 group-hover:bg-white relative",
                  records || isActive ? "bg-white" : "",
                  isTracking &&
                    isSameDay(new Date(), isoDate) &&
                    "!bg-[#00C969]"
                )}
              />
            </div>

            <span
              className={cn(
                "text-xs absolute top-9 invisible group-hover:visible",
                isActive && "visible"
              )}
            >
              {format(day, "EEEEEE d")}
            </span>
          </button>
        </HoverCardTrigger>

        {!disableHover && (
          <HoverCardContent
            className="w-[220px] rounded-xl border shadow-sm bg-background p-0"
            sideOffset={30}
          >
            <div className="flex justify-between border-b-[1px] pl-3 pr-3 py-2.5 items-center">
              <span className="text-xs">Total</span>
              <span className="text-xs font-medium">
                {secondsToHoursAndMinutes(totalDuration)}
              </span>
            </div>
            <div className="p-3 flex flex-col space-y-3">
              {records?.map((record) => {
                return (
                  <div key={record.id} className="flex items-center">
                    <div className="flex space-x-2 items-center">
                      <Avatar className="rounded-full w-5 h-5">
                        <AvatarImage src={record?.assigned?.avatar_url} />
                        <AvatarFallback>
                          <span className="text-xs">
                            {record?.assigned?.full_name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      <button
                        className="flex flex-col"
                        type="button"
                        onClick={() =>
                          handleOnSelect({ id: record.project.id, date: day })
                        }
                      >
                        <span className="text-xs">{record.project?.name}</span>
                        <span className="text-xs text-[#878787]">
                          {record?.description}
                        </span>
                      </button>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs">
                        {secondsToHoursAndMinutes(record.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    );
  });

  return <div className="grid gap-9 rid grid-cols-7">{rows}</div>;
}
