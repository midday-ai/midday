"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
});

export function ChangeEmail() {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());
  const updateUserMutation = useMutation(trpc.user.update.mutationOptions());

  const form = useZodForm(formSchema, {
    defaultValues: {
      email: user.email ?? undefined,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateUserMutation.mutate({
      email: data.email,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Change your email address.</CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="email"
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
            <div>
              This is your primary email address for notifications and more.
            </div>
            <SubmitButton
              type="submit"
              isSubmitting={updateUserMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
