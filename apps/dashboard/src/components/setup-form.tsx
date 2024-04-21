"use client";

import { setupUserSchema } from "@/actions/schema";
import { setupUserAction } from "@/actions/setup-user-action";
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
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export function SetupForm() {
  const setupUser = useAction(setupUserAction, {
    onError: () => alert("error"),
  });

  const form = useForm<z.infer<typeof setupUserSchema>>({
    resolver: zodResolver(setupUserSchema),
    defaultValues: {
      full_name: "",
      team_name: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(setupUser.execute)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormDescription>
                This is your first and last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="team_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team name</FormLabel>
              <FormControl>
                <Input placeholder="Team name" {...field} />
              </FormControl>
              <FormDescription>This is your team name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={setupUser.status === "executing"}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
