"use client";

import { AssignUser } from "@/components/assign-user";
import { SelectAccount } from "@/components/select-account";
import { SelectCategory } from "@/components/select-category";
import { SelectCurrency } from "@/components/select-currency";
import { TransactionAttachments } from "@/components/transaction-attachments";
import { useTeamQuery } from "@/hooks/use-team";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { CurrencyInput } from "@midday/ui/currency-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Select } from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  bankAccountId: z.string(),
  assignedId: z.string().optional(),
  categorySlug: z.string().optional(),
  note: z.string().optional(),
  internal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        path: z.array(z.string()),
        name: z.string(),
        size: z.number(),
        type: z.string(),
      }),
    )
    .optional(),
});

export function TransactionCreateForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useTransactionParams();
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const { data: accounts } = useQuery(
    trpc.bankAccounts.get.queryOptions({
      enabled: true,
    }),
  );

  const { data: categories } = useQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  const createTransactionMutation = useMutation(
    trpc.transactions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        setParams(null);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: undefined,
      categorySlug: undefined,
      date: new Date().toISOString(),
      bankAccountId: accounts?.at(0)?.id,
      assignedId: user?.id,
      note: undefined,
      currency: team?.baseCurrency ?? undefined,
      attachments: undefined,
      internal: undefined,
    },
  });

  const category = form.watch("categorySlug");
  const attachments = form.watch("attachments");
  const bankAccountId = form.watch("bankAccountId");

  useEffect(() => {
    if (user) {
      form.setValue("assignedId", user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!bankAccountId && accounts?.length) {
      const firstAccountId = accounts.at(0)?.id;
      if (firstAccountId) {
        form.setValue("bankAccountId", firstAccountId);
      }
    }
  }, [accounts, bankAccountId]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {
          createTransactionMutation.mutate(form.getValues());
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue);

                      if (values.floatValue && values.floatValue > 0) {
                        form.setValue("categorySlug", "income");
                      }

                      if (
                        category === "income" &&
                        values.floatValue !== undefined &&
                        values.floatValue < 0
                      ) {
                        form.setValue("categorySlug", undefined);
                      }
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Currency</FormLabel>

                <FormControl>
                  <SelectCurrency
                    className="w-full"
                    currencies={uniqueCurrencies}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <SelectAccount
                    onChange={(value) => {
                      field.onChange(value.id);

                      if (value.currency) {
                        form.setValue("currency", value.currency);
                      }
                    }}
                    value={field.value}
                    placeholder="Select account"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Date</FormLabel>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setIsOpen(true)}
                      >
                        {field.value ? (
                          format(
                            new Date(field.value),
                            user?.dateFormat ?? "PPP",
                          )
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                  </FormControl>

                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(value) => {
                        field.onChange(value?.toISOString());
                        setIsOpen(false);
                      }}
                      initialFocus
                      toDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="categorySlug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <SelectCategory
                    onChange={(value) => {
                      field.onChange(value?.slug);
                    }}
                    hideLoading
                    selected={categories?.find(
                      (category) => category.slug === field.value,
                    )}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Assign</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <AssignUser
                      selectedId={field.value}
                      onSelect={field.onChange}
                    />
                  </FormControl>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Accordion type="multiple" defaultValue={["attachment"]}>
          <AccordionItem value="attachment">
            <AccordionTrigger>Attachment</AccordionTrigger>
            <AccordionContent>
              <TransactionAttachments
                // NOTE: For manual attachments, we need to generate a unique id
                id={nanoid()}
                data={attachments}
                onUpload={(files) => {
                  form.setValue("attachments", files);
                }}
              />
            </AccordionContent>
          </AccordionItem>

          <div className="mt-6 mb-4">
            <Label
              htmlFor="settings"
              className="mb-2 block font-medium text-md"
            >
              Exclude from analytics
            </Label>
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <p className="text-xs text-muted-foreground">
                  Exclude this transaction from analytics like profit, expense
                  and revenue. This is useful for internal transfers between
                  accounts to avoid double-counting.
                </p>
              </div>

              <FormField
                control={form.control}
                name="internal"
                render={({ field }) => (
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                    }}
                  />
                )}
              />
            </div>
          </div>

          <AccordionItem value="note">
            <AccordionTrigger>Note</AccordionTrigger>
            <AccordionContent>
              <Textarea
                placeholder="Note"
                className="min-h-[100px] resize-none"
                onChange={(e) => {
                  form.setValue("note", e.target.value);
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
          <SubmitButton
            isSubmitting={createTransactionMutation.isPending}
            className="w-full"
          >
            Create
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
