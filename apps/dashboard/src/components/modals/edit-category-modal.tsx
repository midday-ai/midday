import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
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
import { InputColor } from "../input-color";
import { SelectTaxType } from "../select-tax-type";
import { TaxRateInput } from "../tax-rate-input";

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  defaultValue: {
    name: string;
    color: string | null;
    description?: string | null;
    taxRate?: number | null;
    taxType?: string | null;
    taxReportingCode?: string | null;
    excluded?: boolean | null;
  };
};

const formSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  taxRate: z.number().optional().nullable(),
  taxType: z.string().optional().nullable(),
  taxReportingCode: z.string().optional().nullable(),
  excluded: z.boolean().optional().nullable(),
});

type UpdateCategoriesFormValues = z.infer<typeof formSchema>;

export function EditCategoryModal({
  id,
  onOpenChange,
  isOpen,
  defaultValue,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateCategoryMutation = useMutation(
    trpc.transactionCategories.update.mutationOptions({
      onSuccess: () => {
        onOpenChange(false);
        queryClient.invalidateQueries({
          queryKey: trpc.transactionCategories.get.queryKey(),
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id,
      name: defaultValue.name,
      color: defaultValue.color,
      description: defaultValue.description ?? undefined,
      taxRate: defaultValue?.taxRate ? Number(defaultValue.taxRate) : undefined,
      taxType: defaultValue?.taxType ?? undefined,
      taxReportingCode: defaultValue?.taxReportingCode ?? undefined,
      excluded: defaultValue?.excluded ?? false,
    },
  });

  function onSubmit(values: UpdateCategoriesFormValues) {
    updateCategoryMutation.mutate({
      ...values,
      description: values.description ?? null,
      taxRate: values.taxRate
        ? values.taxRate > 0
          ? values.taxRate
          : null
        : null,
      taxType: values.taxType ?? null,
      color: values.color ?? null,
      taxReportingCode: values.taxReportingCode ?? null,
      excluded: values.excluded ?? false,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 mb-6">
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <InputColor
                            placeholder="Category"
                            onChange={({ name, color }) => {
                              form.setValue("color", color);
                              field.onChange(name);
                            }}
                            defaultValue={field.value}
                            defaultColor={form.watch("color") ?? undefined}
                          />
                          <FormMessage />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus={false}
                          placeholder="Description"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxReportingCode"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Report Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus={false}
                          placeholder="Report Code"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
                            name={form.watch("name")}
                            onChange={(value: string) => {
                              field.onChange(value ? Number(value) : undefined);
                            }}
                            onSelect={(taxRate) => {
                              if (taxRate) {
                                form.setValue("taxRate", +taxRate);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex relative gap-2">
                  <span className="text-xs text-muted-foreground flex-1">
                    {
                      taxTypes.find(
                        (taxType) => taxType.value === form.watch("taxType"),
                      )?.description
                    }
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name="excluded"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-1">
                      <div className="border border-border p-3 mt-4">
                        <div className="flex items-center justify-between space-x-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              Exclude from Reports
                            </FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Transactions in this category won't appear in
                              financial reports
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

              <DialogFooter className="mt-8 w-full">
                <div className="space-y-4 w-full">
                  <SubmitButton
                    isSubmitting={updateCategoryMutation.isPending}
                    className="w-full"
                  >
                    Save
                  </SubmitButton>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
