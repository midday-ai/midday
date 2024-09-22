import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { TimeRangeInput } from "@midday/ui/time-range-input";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AssignUser } from "../assign-user";
import { TrackerSelectProject } from "../tracker-select-project";

const formSchema = z.object({
  duration: z.number().min(1),
  project_id: z.string(),
  assigned_id: z.string().optional(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
});

type Props = {
  userId: string;
  teamId: string;
  onCreate: (values: z.infer<typeof formSchema>) => void;
  projectId?: string;
  start?: string;
  end?: string;
};

export function TrackerRecordForm({
  userId,
  teamId,
  onCreate,
  projectId,
  start,
  end,
}: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assigned_id: userId,
      project_id: projectId,
      start: start || "06:45",
      end: end || "08:30",
    },
  });

  useEffect(() => {
    form.setValue("start", start || "06:45");
    form.setValue("end", end || "08:30");
  }, [start, end]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onCreate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mb-12 mt-6 space-y-4"
      >
        <TimeRangeInput
          value={{ start: form.watch("start"), end: form.watch("end") }}
          onChange={(value) => {
            form.setValue("start", value.start);
            form.setValue("end", value.end);
          }}
        />

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <TrackerSelectProject
                  teamId={teamId}
                  selectedId={field.value}
                  onSelect={(projectId: string) => {
                    if (projectId) {
                      field.onChange(projectId);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assigned_id"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <AssignUser
                  selectedId={form.watch("assigned_id")}
                  onSelect={(assignedId: string) => {
                    if (assignedId) {
                      field.onChange(assignedId);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Description" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex mt-6 justify-between">
          <Button className="w-full">Add</Button>
        </div>
      </form>
    </Form>
  );
}
