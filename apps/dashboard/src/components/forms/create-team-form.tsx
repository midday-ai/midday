"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import { SelectCurrency } from "@/components/select-currency";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { uniqueCurrencies } from "@midday/location/currencies";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { use } from "react";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  baseCurrency: z.string(),
});

type Props = {
  defaultCurrencyPromise: Promise<string>;
};

export function CreateTeamForm({ defaultCurrencyPromise }: Props) {
  const currency = use(defaultCurrencyPromise);
  const trpc = useTRPC();
  const changeTeam = useAction(changeTeamAction);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: ({ data }) => {
        if (!data) return;

        changeTeam.execute({
          teamId: data.id,
          redirectTo: "/teams/invite",
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
      baseCurrency: currency,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTeamMutation.mutate({
      name: values.name,
      baseCurrency: values.baseCurrency,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  className="mt-2"
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

        <FormField
          control={form.control}
          name="baseCurrency"
          render={({ field }) => (
            <FormItem className="mt-4 border-b border-border pb-4">
              <FormLabel>Base currency</FormLabel>
              <FormControl>
                <SelectCurrency currencies={uniqueCurrencies} {...field} />
              </FormControl>

              <FormDescription>
                If you have multiple accounts in different currencies, this will
                be the default currency for your team. You can change it later.
              </FormDescription>
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
