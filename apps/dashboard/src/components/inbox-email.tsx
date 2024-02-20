"use client";

import { UpdateTeamFormValues, updateTeamSchema } from "@/actions/schema";
import { updateTeamAction } from "@/actions/update-team-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";

export function InboxEmail({ email }) {
  const action = useAction(updateTeamAction);
  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      inbox_email: email,
      revalidatePath: "/settings",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    action.execute(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Inbox Forwarding</CardTitle>
            <CardDescription>
              Automatically forward Inox messages to another email.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="inbox_email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className="max-w-[300px]"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div />
            <Button type="submit" disabled={action.status === "executing"}>
              {action.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
