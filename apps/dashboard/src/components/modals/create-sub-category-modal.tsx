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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { InputColor } from "../input-color";
import { SelectTaxType } from "../select-tax-type";
import { TaxRateInput } from "../tax-rate-input";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  parentId: string;
  defaultTaxRate?: number;
  defaultTaxType?: string;
  defaultColor?: string;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  taxRate: z.number().optional().nullable(),
  taxType: z.string().optional().nullable(),
  parentId: z.string().uuid(),
});

type CreateSubCategoryFormValues = z.infer<typeof formSchema>;

export function CreateSubCategoryModal({
  parentId,
  onOpenChange,
  isOpen,
  defaultTaxRate,
  defaultTaxType,
  defaultColor,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createSubCategoryMutation = useMutation(
    trpc.transactionCategories.create.mutationOptions({
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
      name: "",
      description: "",
      parentId,
      taxRate: defaultTaxRate,
      taxType: defaultTaxType,
      color: defaultColor,
    },
  });

  function onSubmit(values: CreateSubCategoryFormValues) {
    createSubCategoryMutation.mutate({
      ...values,
      description: values.description ?? undefined,
      color: values.color ?? undefined,
      taxRate: values.taxRate ?? undefined,
      taxType: values.taxType ?? undefined,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create Sub Category</DialogTitle>
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
              </div>

              <DialogFooter className="mt-8 w-full">
                <div className="space-y-4 w-full">
                  <SubmitButton
                    isSubmitting={createSubCategoryMutation.isPending}
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
