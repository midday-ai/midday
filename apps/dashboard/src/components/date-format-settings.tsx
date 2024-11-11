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
        <CardTitle>Date format</CardTitle>
        <CardDescription>
          This will change how all date related data in your app looks.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={dateFormat}
          onValueChange={(value) => {
            action.execute({ date_format: value });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
