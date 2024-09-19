import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@absplatform/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@absplatform/ui/form";
import { Input } from "@absplatform/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AssignUser } from "../assign-user";
import { TimeInput } from "../time-input";

const formSchema = z.object({
  duration: z.number().min(1),
  assigned_id: z.string().optional(),
  description: z.string().optional(),
});

export function CreateRecordForm({ userId, onCreate, projectId }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assigned_id: userId,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onCreate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mb-12 mt-6">
        <span>Add time</span>

        <div className="flex space-x-4 mb-4 mt-2">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-xs">Time</FormLabel>
                <FormControl>
                  <TimeInput
                    onChange={(seconds) => {
                      field.onChange(+seconds);
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
                <FormLabel className="text-xs">Assign</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description</FormLabel>
              <FormControl>
                <Input placeholder="Description" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex mt-6 justify-between">
          <Button className="w-full" disabled={projectId === "new"}>
            Add
          </Button>
        </div>
      </form>
    </Form>
  );
}
