"use client";

import {
  TrackerAddRecordSchema,
  trackerAddRecordSchema,
} from "@/actions/schema";
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
import { useFieldArray, useForm } from "react-hook-form";

export function TrackerAddRecord() {
  const form = useForm<TrackerAddRecordSchema>({
    resolver: zodResolver(trackerAddRecordSchema),
    defaultValues: {
      records: [
        {
          time: 0,
          assignedId: undefined,
          descriptionId: undefined,
        },
      ],
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    // inviteMembers.execute({
    //   // Remove invites without email (last appended invite validation)
    //   invites: data.invites.filter((invite) => invite.email !== undefined),
    // });
  });

  const { fields, append } = useFieldArray({
    name: "records",
    control: form.control,
  });

  return (
    <div className="h-full mb-[120px] mt-8">
      <div className="sticky top-0 bg-background z-20">
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
            {fields.map((field, index) => (
              <div>
                <div className="flex space-x-4 mb-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.time`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                          <Input placeholder="Hours" {...field} />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.assingedId`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Assigned</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Assigned"
                            {...field}
                            type="number"
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`records.${index}.descriptionId`}
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
            onClick={() => append({ time: 0 })}
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
