import { secondsToHoursAndMinutes } from "@/utils/format";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";

export function RecordSkeleton() {
  return (
    <div className="mb-4">
      <div className="flex items-center">
        <div className="flex space-x-2 items-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="text-sm flex flex-col space-y-1">
            <Skeleton className="h-3 w-[160px]" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
        <span className="ml-auto">
          <Skeleton className="h-3 w-8" />
        </span>
      </div>
    </div>
  );
}

export function UpdateRecordForm({
  id,
  assigned,
  duration,
  onDelete,
  description,
}) {
  return (
    <div className="mb-4 group">
      <div className="flex items-center">
        <div className="flex space-x-2 items-center">
          <Avatar className="h-8 w-8">
            <AvatarImageNext
              src={assigned.avatar_url}
              alt={assigned?.full_name ?? ""}
              width={32}
              height={32}
            />
            <AvatarFallback>
              <span className="text-xs">
                {assigned?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="text-sm flex flex-col">
            <span>{assigned.full_name}</span>
            <span className="text-muted-foreground">{description}</span>
          </div>
        </div>
        <span className="ml-auto group-hover:hidden">
          {secondsToHoursAndMinutes(duration)}
        </span>
        <Button
          variant="outline"
          className="ml-auto hidden group-hover:block text-xs h-7 p-0 px-2"
          onClick={() => onDelete(id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
