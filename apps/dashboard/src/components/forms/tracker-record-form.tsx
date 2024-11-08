import { useTrackerParams } from "@/hooks/use-tracker-params";
import { NEW_EVENT_ID } from "@/utils/tracker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { TimeRangeInput } from "@midday/ui/time-range-input";
import { differenceInSeconds, parse } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AssignUser } from "../assign-user";
import { TrackerSelectProject } from "../tracker-select-project";

const formSchema = z.object({
  id: z.string().optional(),
  duration: z.number().min(1),
  project_id: z.string(),
  assigned_id: z.string().optional(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
});

type Props = {
  eventId?: string;
  userId: string;
  teamId: string;
  onCreate: (values: z.infer<typeof formSchema>) => void;
  projectId?: string | null;
  start?: string;
  end?: string;
  onSelectProject: (selected: { id: string; name: string }) => void;
  description?: string;
  isSaving: boolean;
};

export function TrackerRecordForm({
  eventId,
  userId,
  teamId,
  onCreate,
  projectId,
  start,
  end,
  onSelectProject,
  description,
  isSaving,
}: Props) {
  const { projectId: selectedProjectId } = useTrackerParams();

  const isUpdate = eventId && eventId !== NEW_EVENT_ID;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: eventId,
      assigned_id: userId,
      project_id: selectedProjectId ?? undefined,
      start,
      end,
      description: description ?? undefined,
    },
  });

  useEffect(() => {
    if (eventId && eventId !== NEW_EVENT_ID) {
      form.setValue("id", eventId, { shouldValidate: true });
    }

    if (eventId === NEW_EVENT_ID) {
      form.setValue("id", undefined);
    }

    if (start) {
      form.setValue("start", start);
    }
    if (end) {
      form.setValue("end", end);
    }

    if (projectId) {
      form.setValue("project_id", projectId, { shouldValidate: true });
    }

    if (description) {
      form.setValue("description", description);
    }

    if (start && end) {
      const startDate = parse(start, "HH:mm", new Date());
      const endDate = parse(end, "HH:mm", new Date());

      const durationInSeconds = differenceInSeconds(endDate, startDate);

      if (durationInSeconds) {
        form.setValue("duration", durationInSeconds, { shouldValidate: true });
      }
    }
  }, [start, end, projectId, description, eventId]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onCreate)}
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
                  onCreate={(project) => {
                    if (project) {
                      field.onChange(project.id);
                      onSelectProject(project);
                    }
                  }}
                  teamId={teamId}
                  selectedId={field.value}
                  onSelect={(selected) => {
                    if (selected) {
                      field.onChange(selected.id);
                      onSelectProject(selected);
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
          <SubmitButton
            className="w-full"
            disabled={isSaving || !form.formState.isValid}
            isSubmitting={isSaving}
            type="submit"
          >
            {isUpdate ? "Update" : "Add"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
