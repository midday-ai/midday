import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { AssignUser } from "../assign-user";
import { TimeInput } from "../time-input";

export function CreateRecordForm({ duration, assignedId }) {
  return (
    <div className="mb-12">
      <span>Add time</span>

      <div className="flex space-x-4 mb-4 mt-4">
        <div className="w-full">
          <Label className="text-xs">Time</Label>
          <TimeInput
            className="mt-1"
            defaultValue={duration}
            // onChange={(seconds) => onChange({ id, duration: seconds })}
          />
        </div>

        <div className="w-full">
          <AssignUser
            selectedId={assignedId}
            // onSelect={(assignedId) => onChange({ id, assignedId })}
          />
        </div>
      </div>

      <div className="w-full">
        <Label className="text-xs">Description</Label>
        <Input
          className="mt-1"
          placeholder="Description"
          //   onBlur={(evt) => onChange({ id, description: evt.target.value })}
        />
      </div>

      <div className="flex mt-3 justify-between">
        <Button className="w-full">Add</Button>
        {/* <button
          type="button"
          className="flex space-x-2 items-center text-sm font-medium"
          //   onClick={onCreate}
        >
          <Icons.Add />
          Add
        </button> */}
      </div>
    </div>
  );
}
