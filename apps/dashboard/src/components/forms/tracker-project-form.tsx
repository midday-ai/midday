"use client";

import { SearchCustomers } from "@/components/search-customers";
import { SelectTags } from "@/components/select-tags";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { uniqueCurrencies } from "@midday/location/currencies";
import { Collapsible, CollapsibleContent } from "@midday/ui/collapsible";
import { CurrencyInput } from "@midday/ui/currency-input";
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
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  estimate: z.number().optional(),
  billable: z.boolean().optional().default(false),
  rate: z.number().min(1).optional(),
  currency: z.string().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional(),
});

type Props = {
  data?: RouterOutputs["trackerProjects"]["getById"];
  defaultCurrency: string;
};

export function TrackerProjectForm({ data, defaultCurrency }: Props) {
  const isEdit = !!data;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams: setTrackerParams } = useTrackerParams();
  const { setParams: setCustomerParams } = useCustomerParams();

  const upsertTrackerProjectMutation = useMutation(
    trpc.trackerProjects.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.trackerProjects.getById.queryKey(),
        });

        // Close the tracker project form
        setTrackerParams(null);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name ?? undefined,
      description: data?.description ?? undefined,
      rate: data?.rate ?? undefined,
      status: data?.status ?? "in_progress",
      billable: data?.billable ?? false,
      estimate: data?.estimate ?? 0,
      currency: data?.currency ?? defaultCurrency,
      customer_id: data?.customer_id ?? undefined,
      tags:
        data?.tags?.map((tag) => ({
          id: tag.tag?.id ?? "",
          value: tag.tag?.name ?? "",
        })) ?? undefined,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formattedData = {
      ...data,
      id: data.id || undefined,
      description: data.description || null,
      rate: data.rate || null,
      currency: data.currency || null,
      billable: data.billable || false,
      estimate: data.estimate || null,
      status: data.status || "in_progress",
      customer_id: data.customer_id || null,
      tags: data.tags?.length ? data.tags : null,
    };

    upsertTrackerProjectMutation.mutate(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </FormControl>
              <FormDescription>
                This is the project display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <FormControl>
                <SearchCustomers
                  onSelect={(id) =>
                    field.onChange(id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  selectedId={field.value ?? undefined}
                  onCreate={(name) => {
                    setCustomerParams({
                      name,
                      createCustomer: true,
                    });
                  }}
                  onEdit={(id) => {
                    setCustomerParams({
                      customerId: id,
                    });
                  }}
                />
              </FormControl>
              <FormDescription>
                Link a customer to enable direct invoicing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6">
          <Label htmlFor="tags" className="mb-2 block">
            Expense Tags
          </Label>

          <SelectTags
            tags={(form.getValues("tags") ?? []).map((tag) => ({
              id: tag.id,
              value: tag.value,
              label: tag.value,
            }))}
            onRemove={(tag) => {
              form.setValue(
                "tags",
                form.getValues("tags")?.filter((t) => t.id !== tag.id),
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              );
            }}
            onSelect={(tag) => {
              form.setValue(
                "tags",
                [
                  ...(form.getValues("tags") ?? []),
                  {
                    value: tag.value ?? "",
                    id: tag.id ?? "",
                  },
                ],
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              );
            }}
          />

          <FormDescription className="mt-2">
            Tags help categorize and track project expenses.
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormDescription>
                Add a short description about the project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="estimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Estimate</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    {...field}
                    type="number"
                    min={0}
                    onChange={(evt) => field.onChange(+evt.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </FormControl>
                <FormDescription>
                  Set a goal for how long your project should take to complete
                  in hours.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Collapsible open={form.watch("billable")}>
          <FormItem className="flex justify-between items-center">
            <FormLabel>Billable</FormLabel>

            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormItem>

          <CollapsibleContent className="space-y-2 w-full">
            <div className="flex space-x-4 mt-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Hourly Rate</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        min={0}
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

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {uniqueCurrencies.map((currency) => (
                          <SelectItem value={currency} key={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
          <SubmitButton
            className="w-full"
            disabled={
              upsertTrackerProjectMutation.isPending || !form.formState.isDirty
            }
            isSubmitting={upsertTrackerProjectMutation.isPending}
          >
            {isEdit ? "Update" : "Create"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
