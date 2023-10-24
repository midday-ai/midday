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

export function SelectVat({ id, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const handleOnValueChange = (value: string) => {
    startTransition(() => {
      updateTransactionAction(id, { vat: value });
    });
  };

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  return (
    <>
      <Label htmlFor="tax">Tax Rate</Label>

      <div className="relative">
        <Select value={value} onValueChange={handleOnValueChange}>
          <SelectTrigger id="tax" className="line-clamp-1 truncate">
            {isLoading && (
              <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-2.5 z-10" />
            )}
            <SelectValue placeholder={!isLoading && "Select"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25%</SelectItem>
            <SelectItem value="12">12%</SelectItem>
            <SelectItem value="7">7%</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
