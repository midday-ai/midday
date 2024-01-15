import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { format } from "date-fns/format";

export function TrackerRecords({ data, date }) {
  return (
    <div>
      <div className="mt-8 sticky top-0 bg-background z-20">
        <div className="flex justify-between items-center border-b-[1px] pb-3">
          <span>{format(new Date(date), "MMM d")}</span>
          <span>
            20
            <span className="text-[#878787]">h</span>
          </span>
        </div>
      </div>

      <div className="flex space-y-4 flex-col mt-4">
        {data?.map((record) => (
          <div key={record.id} className="flex justify-between items-center">
            <div className="flex space-x-2 items-center">
              <div className="relative">
                {record.user?.working && (
                  <div className="w-[8px] h-[8px] rounded-full bg-[#00C969] absolute z-10 -right-[1px] -top-[1px] border border-[1px] border-background" />
                )}
                <Avatar className="rounded-full w-7 h-7">
                  <AvatarImage src={record?.user?.avatar_url} />
                  <AvatarFallback>
                    <span className="text-xs">
                      {record?.user?.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col">
                <span className="text-xs">{record.user.full_name}</span>
                <span className="text-[#878787] text-xs">
                  {record?.description}
                </span>
              </div>
            </div>

            <span className="text-sm">{record.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
