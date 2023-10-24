import { updateTransactionAction } from "@/actions";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { startTransition } from "react";

export function SelectVat({ id, selectedId }) {
  const handleOnValueChange = (value: string) => {
    startTransition(() => {
      updateTransactionAction(id, { vat: value });
    });
  };

  return (
    <>
      <Label htmlFor="tax">Tax Rate</Label>
      <Select defaultValue={selectedId} onValueChange={handleOnValueChange}>
        <SelectTrigger id="tax" className="line-clamp-1 truncate">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25%</SelectItem>
          <SelectItem value="12">12%</SelectItem>
          <SelectItem value="7">7%</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
