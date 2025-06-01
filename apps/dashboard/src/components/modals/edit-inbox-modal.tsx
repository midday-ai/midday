"use client";

import { useInboxParams } from "@/hooks/use-inbox-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { CurrencyInput } from "@midday/ui/currency-input";
import { DialogContent, DialogHeader, DialogTitle } from "@midday/ui/dialog";
import { Dialog } from "@midday/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Form } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

type Props = {
  children: React.ReactNode;
};

const formSchema = z.object({
  displayName: z.string().min(1),
  amount: z.number(),
});

export function EditInboxModal({ children }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { params } = useInboxParams();

  const { data } = useQuery(
    trpc.inbox.getById.queryOptions(
      {
        id: params.inboxId!,
      },
      {
        enabled: !!params.inboxId,
      },
    ),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      displayName: data?.displayName ?? undefined,
      amount: data?.amount ?? undefined,
    },
  });

  const updateInboxMutation = useMutation(
    trpc.inbox.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.queryKey(),
        });
      },
    }),
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateInboxMutation.mutate({
      id: data?.id!,
      displayName: values.displayName,
      amount: values.amount,
    });
  }

  useEffect(() => {
    if (data) {
      form.reset({
        displayName: data.displayName ?? undefined,
        amount: data.amount ?? undefined,
      });
    }
  }, [data]);

  return (
    <Dialog>
      <DialogContent
        className="max-w-[455px]"
        onOpenAutoFocus={(evt) => evt.preventDefault()}
      >
        <div className="p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        min={0}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        value={field.value}
                        onValueChange={(values) => {
                          field.onChange(values.floatValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SubmitButton
                type="submit"
                isSubmitting={updateInboxMutation.isPending}
                className="mt-4 w-full"
              >
                Save
              </SubmitButton>
            </form>
          </Form>
        </div>
      </DialogContent>

      {children}
    </Dialog>
  );
}
