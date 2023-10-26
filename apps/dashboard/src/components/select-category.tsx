import { updateTransactionAction } from "@/actions";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { startTransition, useEffect, useState } from "react";

export function SelectCategory({ id, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const handleOnValueChange = (value: string) => {
    startTransition(() => {
      updateTransactionAction(id, { category: value });
    });
  };

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  return (
    <div className="relative">
      <Label htmlFor="tax">Category</Label>

      <div className="mt-1">
        {isLoading ? (
          <div className="h-[36px] border rounded-md">
            <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-[35px]" />
          </div>
        ) : (
          <Select value={value} onValueChange={handleOnValueChange}>
            <SelectTrigger id="tax" className="line-clamp-1 truncate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="12">12%</SelectItem>
              <SelectItem value="7">7%</SelectItem>
              <SelectItem value="0">0%</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
