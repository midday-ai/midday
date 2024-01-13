import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

export function TrackerMonthGraph({ date }) {
  const result = eachDayOfInterval({
    start: startOfMonth(new Date(date)),
    end: endOfMonth(new Date(date)),
  });

  const rows = result.map((day, i) => (
    <HoverCard key={i.toString()} openDelay={80} closeDelay={20}>
      <HoverCardTrigger asChild>
        <div className="w-[28px] h-[28px] rounded-full border flex items-center justify-center group border-transparent hover:border-white transition-colors">
          <div className="w-[20px] h-[20px] rounded-full bg-[#878787]/30 group-hover:bg-white relative">
            {/* <span className="text-xs absolute w-[60px] top-8 -left-[30px] text-center">
              {format(day, "EEEEEE i")}
            </span> */}
          </div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-[220px] rounded-xl border shadow-sm bg-background p-0">
        <div className="flex justify-between border-b-[1px] pl-3 pr-3 py-2">
          <span>Total</span>
          <span>16h</span>
        </div>
        <div className="p-3">wwef</div>
      </HoverCardContent>
    </HoverCard>
  ));

  return <div className="grid gap-9 rid grid-cols-7">{rows}</div>;
}
