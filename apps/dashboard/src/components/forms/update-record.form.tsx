import { AssignUser } from "@/components//assign-user";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Skeleton } from "@midday/ui/skeleton";
import { TimeInput } from "../time-input";

export function RecordSkeleton() {
  return (
    <div className="mb-12">
      <div className="flex space-x-4 mb-4 mt-4">
        <div className="w-full">
          <Label>Time</Label>
          <Skeleton className="h-9 w-full" />
        </div>

        <div className="w-full">
          <Label>Assign</Label>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="w-full">
        <Label>Description</Label>
        <Skeleton className="h-9 w-full" />
      </div>

      <div className="flex mt-3 justify-end">
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

export function UpdateRecordForm({ id, duration, assignedId }) {
  return (
    <div className="mb-12">
      <div className="flex space-x-4 mb-4 mt-4">
        <div className="w-full">
          <Label>Time</Label>
          <TimeInput
            defaultValue={duration}
            onChange={(seconds) => console.log(seconds)}
          />
        </div>

        <div className="w-full">
          <AssignUser selectedId={assignedId} />
        </div>
      </div>

      <div className="w-full">
        <Label>Description</Label>
        <Input placeholder="Description" />
      </div>

      <div className="flex mt-3 justify-between">
        <button
          type="button"
          className="flex space-x-2 items-center text-sm font-medium"
          // onClick={() => append(defaultEntry)}
        >
          <Icons.Add />
          Add
        </button>

        <button
          type="button"
          className="text-sm font-medium"
          // onClick={() => append(defaultEntry)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
