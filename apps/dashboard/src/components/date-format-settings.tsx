"use client";

import { updateUserAction } from "@/actions/update-user-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useAction } from "next-safe-action/hooks";

type Props = {
  dateFormat: string;
};

export function DateFormatSettings({ dateFormat }: Props) {
  const action = useAction(updateUserAction);

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>Date Display Format</CardTitle>
        <CardDescription>
          Select the format used to display dates throughout the app.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={dateFormat}
          onValueChange={(value) => {
            action.execute({
              date_format: value as "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd",
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
            <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
            <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
