import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

export function TrackerMonthGraph({ date, data }) {
  const result = eachDayOfInterval({
    start: startOfMonth(new Date(date)),
    end: endOfMonth(new Date(date)),
  });

  const rows = result.map((day, i) => (
    <HoverCard key={i.toString()} openDelay={80} closeDelay={20}>
      <HoverCardTrigger asChild>
        <div className="w-[35px] flex items-center justify-center group relative">
          <div className="w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white transition-colors">
            <div className="w-[20px] h-[20px] rounded-full bg-[#878787]/30 group-hover:bg-white relative" />
          </div>

          <span className="text-xs absolute top-9 invisible group-hover:visible">
            {format(day, "EEEEEE d")}
          </span>
        </div>
      </HoverCardTrigger>

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
              <div className="flex flex-col">
                <span className="text-xs">Project X</span>
                <span className="text-xs text-[#878787]">
                  Webflow Development
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <span className="text-xs">7h</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex space-x-2 items-center">
              <Avatar className="rounded-full w-5 h-5">
                <AvatarImage src="https://service.midday.ai/storage/v1/object/public/avatars/efea0311-0786-4f70-9b5a-63e3efa5d319/EEA53AB2-6294-45ED-8D24-B9B43A1C2B7A.jpg" />
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
    </HoverCard>
  ));

  return <div className="grid gap-9 rid grid-cols-7">{rows}</div>;
}
