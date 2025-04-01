import { Card } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";

export function AccountSettingsSkeleton() {
  return (
    <div className="space-y-12">
      {/* Avatar section */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>

      {/* Display name section */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
      </Card>

      {/* Theme selector section */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>
      </Card>

      {/* Delete account section */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
      </Card>
    </div>
  );
}
