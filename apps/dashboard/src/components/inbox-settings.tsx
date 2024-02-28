"use client";

import { UpdateTeamFormValues, updateTeamSchema } from "@/actions/schema";
import { updateTeamAction } from "@/actions/update-team-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";

export function InboxSettings({ email, onSuccess }) {
  const action = useAction(updateTeamAction, {
    onSuccess,
  });

  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      inbox_email: email,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    action.execute(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col">
        <FormField
          control={form.control}
          name="inbox_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forwarding email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  type="email"
                  placeholder="hello@example.com"
                />
              </FormControl>
              <FormDescription>
                We will send a copy of the emails to this address, leave blank
                if you don't want to recive these.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="w-full mt-8">
          <Button
            type="submit"
            disabled={action.status === "executing"}
            className="w-full"
          >
            {action.status === "executing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
