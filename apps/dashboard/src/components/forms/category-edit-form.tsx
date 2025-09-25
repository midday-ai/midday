"use client";

import { InputColor } from "@/components/input-color";
import { SelectParentCategory } from "@/components/select-parent-category";
import { SelectTaxType } from "@/components/select-tax-type";
import { TaxRateInput } from "@/components/tax-rate-input";
import { useCategoryParams } from "@/hooks/use-category-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { taxTypes } from "@midday/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  taxRate: z.number().optional().nullable(),
  taxType: z.string().optional().nullable(),
  taxReportingCode: z.string().optional().nullable(),
  excluded: z.boolean().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

type UpdateCategoriesFormValues = z.infer<typeof formSchema>;

type Props = {
  data?: RouterOutputs["transactionCategories"]["getById"];
};

export function CategoryEditForm({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useCategoryParams();

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      description: data?.description || "",
      color: data?.color || "",
      taxRate: data?.taxRate || undefined,
      taxType: data?.taxType || "",
      taxReportingCode: data?.taxReportingCode || "",
      excluded: data?.excluded || false,
      parentId: data?.parentId || undefined,
    },
  });

  const updateCategoryMutation = useMutation(
    trpc.transactionCategories.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionCategories.get.queryKey(),
        });

        setParams(null);
      },
    }),
  );

  function onSubmit(values: UpdateCategoriesFormValues) {
    updateCategoryMutation.mutate({
      id: values.id,
      name: values.name,
      description: values.description || null,
      color: values.color || null,
      taxRate: values.taxRate || null,
      taxType: values.taxType || null,
      taxReportingCode: values.taxReportingCode || null,
      excluded: values.excluded || null,
      parentId: values.parentId ?? null,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 h-[calc(100vh-130px)]"
      >
        <div className="flex flex-col space-y-6 overflow-auto">
          <div className="flex flex-col space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Name
                  </FormLabel>
                  <FormControl>
                    <InputColor
                      autoFocus
                      placeholder="Name"
                      onChange={({ name, color }) => {
                        field.onChange(name);
                        form.setValue("color", color);
                      }}
                      defaultValue={field.value}
                      defaultColor={form.watch("color") ?? undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => {
                const hasChildren = data?.children && data.children.length > 0;

                return (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Parent Category (Optional)
                    </FormLabel>
                    <FormControl>
                      {hasChildren ? (
                        <div className="flex items-center space-x-2 p-3 border border-border bg-muted/50">
                          <span className="text-sm text-muted-foreground">
                            Cannot change parent - this category has children
                          </span>
                        </div>
                      ) : (
                        <SelectParentCategory
                          parentId={field.value}
                          onChange={(parent) => {
                            field.onChange(parent?.id ?? undefined);
                          }}
                          excludeIds={data?.id ? [data.id] : []}
                        />
                      )}
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus={false}
                      placeholder="Description"
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxReportingCode"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Report Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus={false}
                      placeholder="Report Code"
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div>
            <div className="flex relative gap-2">
              <FormField
                control={form.control}
                name="taxType"
                render={({ field }) => (
                  <FormItem className="w-[300px] space-y-1">
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Tax Type
                    </FormLabel>
                    <FormControl>
                      <SelectTaxType
                        value={field.value ?? ""}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-1">
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Tax Rate
                    </FormLabel>
                    <FormControl>
                      <TaxRateInput
                        value={field.value}
                        name={form.watch("name") ?? ""}
                        isNewProduct={false}
                        onChange={(value: string) => {
                          field.onChange(value ? Number(value) : undefined);
                        }}
                        onSelect={(taxRate) => {
                          if (taxRate) {
                            field.onChange(taxRate);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex relative gap-2 mt-2">
              <span className="text-xs text-muted-foreground flex-1">
                {
                  taxTypes.find(
                    (taxType) => taxType.value === form.watch("taxType"),
                  )?.description
                }
              </span>
            </div>
          </div>

          <FormField
            control={form.control}
            name="excluded"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-1">
                <div className="border border-border p-3 mt-2 pt-1.5">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Exclude from Reports
                      </FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Transactions in this category won't appear in financial
                        reports
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex-1" />
        <div className="pt-6 border-t mt-auto">
          <SubmitButton
            isSubmitting={updateCategoryMutation.isPending}
            className="w-full"
          >
            Update
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
