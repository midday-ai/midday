"use client";

import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsById } from "@midday/supabase/queries";
import { useEffect, useState } from "react";

export function TrackerAddRecord({ assignedId, projectId, date, teamId }) {
  const supabase = createClient();
  const [isLoading, setLoading] = useState(false);
  const [records, setRecords] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getTrackerRecordsById(supabase, {
          projectId,
          date,
          teamId,
        });
        setLoading(false);
        setRecords(data);
      } catch {
        setLoading(false);
      }
    }

    if (!records) {
      fetchData();
    }
  }, [date]);

  console.log(records);

  return (
    <div className="h-full mb-[120px] mt-8">
      <div className="sticky top-0 bg-[#FAFAF9] dark:bg-[#121212] z-20">
        <div className="flex justify-between items-center border-b-[1px] pb-3">
          <h2>Add record</h2>
        </div>
      </div>

      {/* <Form>
        <form>
          <div className="mb-12">
            <div className="flex space-x-4 mb-4 mt-4">
              <FormField
                // control={form.control}
                // name={`records.${index}.duration`}
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
                // control={form.control}
                // name={`records.${index}.assigned_id`}
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
              // control={form.control}
              // name={`records.${index}.description`}
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

            <div className="flex mt-3 justify-between">
              <button
                type="button"
                className="flex space-x-2 items-center text-sm font-medium"
                // onClick={() => append(defaultEntry)}
              >
                <Icons.Add />
                Add
              </button>

              <button
                type="button"
                className="text-sm font-medium"
                // onClick={() => append(defaultEntry)}
              >
                Remove
              </button>
            </div>
          </div>
        </form>
      </Form> */}
    </div>
  );
}
