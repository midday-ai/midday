"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
});

export function CreateTeamForm() {
  const trpc = useTRPC();
  const changeTeam = useAction(changeTeamAction);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: ({ teamId }) => {
        if (!teamId) return;

        changeTeam.execute({
          teamId,
          redirectTo: "/teams/invite",
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTeamMutation.mutate({ name: values.name });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  autoFocus
                  className="mt-3"
                  placeholder="Ex: Acme Marketing or Acme Co"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          className="mt-6 w-full"
          type="submit"
          isSubmitting={createTeamMutation.isPending}
        >
          Next
        </SubmitButton>
      </form>
    </Form>
  );
}
