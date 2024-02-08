"use client";

import { createEntriesAction } from "@/actions/project/create-entries-action";
import {
  TrackerAddRecordSchema,
  trackerAddRecordSchema,
} from "@/actions/schema";
import { AssignUser } from "@/components/assign-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

export function TrackerAddRecord({ assignedId, projectId, date }) {
  const { toast } = useToast();

  const defaultEntry = {
    assigned_id: assignedId,
    project_id: projectId,
    duration: undefined,
    description: undefined,
    start: (date && new Date(date).toISOString()) || new Date().toISOString(),
  };

  const createEntries = useAction(createEntriesAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const form = useForm<TrackerAddRecordSchema>({
    resolver: zodResolver(trackerAddRecordSchema),
    defaultValues: {
      records: [defaultEntry],
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createEntries.execute(
      data.records.map((record) => ({
        ...record,
        project_id: projectId,
        duration: record.duration * 3600,
      }))
    );
  });

  const { fields, append } = useFieldArray({
    name: "records",
    control: form.control,
  });

  return (
    <div className="h-full mb-[120px] mt-8">
      <div className="sticky top-0 bg-[#FAFAF9] dark:bg-[#121212] z-20">
        <div className="flex justify-between items-center border-b-[1px] pb-3">
          <h2>Add record</h2>
        </div>
      </div>

      <Form {...form} className="h-full">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full relative"
        >
          <div className="mb-3">
            {fields.map((_, index) => (
              <div key={index.toString()}>
                <div className="flex space-x-4 mb-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.duration`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0"
                            type="number"
                            min={0}
                            onChange={(evt) => {
                              field.onChange(+evt.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.assigned_id`}
                    render={({ field }) => {
                      return (
                        <FormItem className="w-full">
                          <AssignUser selectedId={field.value} />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`records.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="flex space-x-2 items-center text-sm font-medium"
            onClick={() => append(defaultEntry)}
          >
            <Icons.Add />
            Add item
          </button>

          <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
            <Button className="w-full">Save</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
