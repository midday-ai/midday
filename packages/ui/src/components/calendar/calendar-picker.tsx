"use client";

import React from "react";
import { Button } from "../button";
import { Card } from "../card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CalendarDatePicker } from "./calendar-date-picker";

const FormSchema = z.object({
  calendar: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export interface CalendarPickerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: () => void;
  initialFrom?: Date;
  initialTo?: Date;
  onDateChange?: (from: Date, to: Date) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  className,
  onClick,
  initialFrom = new Date(new Date().getFullYear(), 0, 1),
  initialTo = new Date(),
  onDateChange,
  ...props
}) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      calendar: {
        from: initialFrom,
        to: initialTo,
      },
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    toast(
      `Date range: ${data.calendar.from.toDateString()} - ${data.calendar.to.toDateString()}`,
    );
    if (onDateChange) {
      onDateChange(data.calendar.from, data.calendar.to);
    }
  };

  return (
    <div className={className} onClick={onClick} {...props}>
      <Card className="w-full max-w-xl p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <FormField
                control={form.control}
                name="calendar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Range</FormLabel>
                    <FormControl>
                      <CalendarDatePicker
                        date={field.value}
                        onDateSelect={({
                          from,
                          to,
                        }: {
                          from: Date;
                          to: Date;
                        }) => {
                          form.setValue("calendar", { from, to });
                          if (onDateChange) {
                            onDateChange(from, to);
                          }
                        }}
                        variant="ghost"
                      />
                    </FormControl>
                    <FormDescription>
                      Select a date range from the calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button variant="outline" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};
