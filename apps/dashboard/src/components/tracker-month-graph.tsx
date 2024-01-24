"use client";

import { useTrackerStore } from "@/store/tracker";
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
  startOfMonth,
} from "date-fns";

export function TrackerMonthGraph({
  date,
  onSelect,
  records,
  showCurrentDate,
  currentProjectId,
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
        id: params.id || currentProjectId,
        date: formatISO(params.date, { representation: "date" }),
      });
    }
  };

  const rows = result.map((day, i) => {
    const isoDate = formatISO(day, { representation: "date" });
    const isActive = showCurrentDate && isoDate === date;
    const foundRecords = records[isoDate];
    const hasRecords = foundRecords?.length > 0;

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
                  hasRecords || isActive ? "bg-white" : "",
                  isTracking && isoDate === "2024-01-15" && "!bg-[#00C969]"
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
              <span className="text-xs font-medium">16h</span>
            </div>
            <div className="p-3 flex flex-col space-y-3">
              <div className="flex items-center">
                <div className="flex space-x-2 items-center">
                  <Avatar className="rounded-full w-5 h-5">
                    <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c" />
                    <AvatarFallback>
                      <span className="text-xs">PA</span>
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="flex flex-col"
                    type="button"
                    onClick={() => handleOnSelect({ id: "123", date: day })}
                  >
                    <span className="text-xs">Project X</span>
                    <span className="text-xs text-[#878787]">Development</span>
                  </button>
                </div>
                <div className="ml-auto">
                  <span className="text-xs">7h</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex space-x-2 items-center">
                  <Avatar className="rounded-full w-5 h-5">
                    <AvatarImage src="https://api.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg" />
                    <AvatarFallback>
                      <span className="text-xs">VH</span>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs">Project X</span>
                    <span className="text-xs text-[#878787]">Design</span>
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="text-xs">7h</span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    );
  });

  return <div className="grid gap-9 rid grid-cols-7">{rows}</div>;
}
