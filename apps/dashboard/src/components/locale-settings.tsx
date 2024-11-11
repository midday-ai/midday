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
  locale: string;
};

export function LocaleSettings({ locale }: Props) {
  const action = useAction(updateUserAction);

  return (
    <Card className="flex justify-between items-center">
      <CardHeader>
        <CardTitle>Locale & Formatting</CardTitle>
        <CardDescription>
          This will change how currency and other locale-specific data is
          formatted throughout the app.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          defaultValue={locale}
          onValueChange={(value) => {
            action.execute({ locale: value });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Locale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-US">English (United States)</SelectItem>
            <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
            <SelectItem value="fr-FR">French (France)</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
