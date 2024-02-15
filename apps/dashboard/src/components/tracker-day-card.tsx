import { secondsToHoursAndMinutes } from "@/utils/format";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { cn } from "@midday/ui/utils";
import { format, isSameDay } from "date-fns";

export function TrackerDayCard({
  date,
  data,
  outOfRange,
  onSelect,
  disableHover,
  isActive,
  isTracking,
  selectProject,
  projectId,
}) {
  const totalDuration = data?.reduce(
    (duration, item) => item.duration + duration,
    0
  );

  const hoverEnabled = !disableHover && data;

  const handleOnClick = () => {
    if (selectProject) {
      onSelect({ day: date, projectId: "new" });
    } else {
      onSelect({ day: date });
    }
  };

  return (
    <HoverCard openDelay={250} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          className="w-[35px] flex items-center justify-center group relative"
          type="button"
          onClick={handleOnClick}
          // NOTE: If specific project view, i.e time report
          disabled={projectId}
        >
          <div
            className={cn(
              "w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white",
              isActive && "border-white",
              isSameDay(new Date(), date) && "border-[#878787]/30"
            )}
          >
            <time
              dateTime={new Date(date).toISOString()}
              className="w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white"
            >
              <div
                className={cn(
                  "w-[20px] h-[20px] rounded-full bg-[#878787]/30 group-hover:bg-white relative",
                  outOfRange && "bg-[#878787]/10",
                  isActive && "bg-white",
                  data && "bg-white",
                  isTracking && "bg-[#00C969]",
                  isSameDay(new Date(), date) && "bg-[#878787]/30"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] absolute top-7 invisible group-hover:visible w-[50px] text-center -ml-[25px]",
                    isActive && "visible"
                  )}
                >
                  {format(new Date(date), "EEEEEE d")}
                </span>
              </div>
            </time>
          </div>
        </button>
      </HoverCardTrigger>

      {hoverEnabled && (
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
            {data?.map((record) => {
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
                      // NOTE: If specific project view, i.e time report
                      disabled={projectId}
                      onClick={() =>
                        onSelect({ projectId: record.project.id, day: date })
                      }
                    >
                      {projectId ? (
                        <span className="text-xs">
                          {record.assigned?.full_name}
                        </span>
                      ) : (
                        <span className="text-xs">{record.project?.name}</span>
                      )}
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
}
