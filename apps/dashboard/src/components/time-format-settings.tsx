"use client";

import { useTRPC } from "@/trpc/client";
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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

export function TimeFormatSettings() {
  const trpc = useTRPC();
  const updateUserMutation = useMutation(trpc.user.update.mutationOptions());

  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>Time Display Format</CardTitle>
        <CardDescription>
          Choose between 12-hour or 24-hour clock format for displaying time.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={user.time_format.toString()}
          onValueChange={(value) => {
            updateUserMutation.mutate({ time_format: +value });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 hours (AM/PM)</SelectItem>
            <SelectItem value="24">24 hours</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
