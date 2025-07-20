"use client";

import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { NEW_EVENT_ID, parseTimeWithMidnightCrossing } from "@/utils/tracker";
import { TZDate } from "@date-fns/tz";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { TimeRangeInput } from "@midday/ui/time-range-input";
import { startOfDay } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AssignUser } from "../assign-user";
import { TrackerSelectProject } from "../tracker-select-project";

const formSchema = z.object({
  id: z.string().optional(),
  duration: z.number().min(1),
  projectId: z.string().uuid(),
  assignedId: z.string().uuid().optional(),
  description: z.string().optional(),
  start: z.string(),
  stop: z.string(),
});

type Props = {
  eventId?: string;
  userId: string;
  teamId: string;
  onCreate: (values: z.infer<typeof formSchema>) => void;
  projectId?: string | null;
  start?: string;
  stop?: string;
  onSelectProject: (selected: { id: string; name: string }) => void;
  description?: string;
  isSaving: boolean;
  onTimeChange: (time: { start: string; end: string }) => void;
};

export function TrackerEntriesForm({
  eventId,
  userId,
  onCreate,
  projectId,
  start,
  stop,
  onSelectProject,
  description,
  isSaving,
  onTimeChange,
}: Props) {
  const { projectId: selectedProjectId } = useTrackerParams();
  const { latestProjectId } = useLatestProjectId();
  const { data: user } = useUserQuery();

  // Helper to get user timezone with fallback
  const getUserTimezone = () => user?.timezone || "UTC";

  const isUpdate = eventId && eventId !== NEW_EVENT_ID;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: eventId,
      assignedId: userId,
      projectId: selectedProjectId || latestProjectId || undefined,
      start,
      stop,
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
    if (stop) {
      form.setValue("stop", stop);
    }

    if (projectId) {
      form.setValue("projectId", projectId, { shouldValidate: true });
    }

    if (description) {
      form.setValue("description", description);
    }

    if (start && stop) {
      // Use timezone-aware time parsing instead of manual conversion
      const timezone = getUserTimezone();
      let baseDate: Date;

      try {
        // Get "today" in user's timezone as reference date for parsing
        const now = new Date();
        const userTzDate = new TZDate(now, timezone);
        baseDate = startOfDay(userTzDate);
      } catch (error) {
        console.warn("TZDate failed in form, using browser date:", error);
        baseDate = startOfDay(new Date());
      }

      // Use the enhanced parseTimeWithMidnightCrossing function
      const { duration } = parseTimeWithMidnightCrossing(
        start,
        stop,
        baseDate,
        timezone,
      );

      if (duration) {
        form.setValue("duration", duration, { shouldValidate: true });
      }
    }
  }, [start, stop, projectId, description, eventId]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onCreate)}
        className="mb-12 mt-6 space-y-4"
      >
        <TimeRangeInput
          value={{ start: form.watch("start"), stop: form.watch("stop") }}
          onChange={(value) => {
            form.setValue("start", value.start);
            form.setValue("stop", value.stop);

            onTimeChange({
              start: value.start,
              end: value.stop,
            });
          }}
        />

        <FormField
          control={form.control}
          name="projectId"
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
          name="assignedId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <AssignUser
                  selectedId={form.watch("assignedId")}
                  onSelect={(user) => {
                    if (user?.id) {
                      field.onChange(user.id);
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
