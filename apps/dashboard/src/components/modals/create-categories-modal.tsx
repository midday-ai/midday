import { InputColor } from "@/components/input-color";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  DialogDescription,
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
} from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { getTaxTypeForCountry, taxTypes } from "@midday/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { SelectTaxType } from "../select-tax-type";
import { TaxRateInput } from "../tax-rate-input";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
};

interface CategoryFormValues {
  name: string;
  description?: string;
  color?: string;
  taxRate?: number;
  taxType?: string;
  taxReportingCode?: string;
  excluded?: boolean;
}

interface CreateCategoriesFormValues {
  categories: CategoryFormValues[];
}

const formSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      color: z.string().optional(),
      taxRate: z.number().optional(),
      taxType: z.string().optional(),
      taxReportingCode: z.string().optional(),
      excluded: z.boolean().optional(),
    }),
  ),
});

export function CreateCategoriesModal({ onOpenChange, isOpen }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();

  const categoriesMutation = useMutation(
    trpc.transactionCategories.createMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionCategories.get.queryKey(),
        });

        onOpenChange(false);
      },
    }),
  );

  const newItem = {
    name: "",
    description: "",
    color: undefined,
    taxType: getTaxTypeForCountry(user?.team?.countryCode ?? "").value,
    taxRate: undefined,
    taxReportingCode: "",
    excluded: false,
  };

  const form = useZodForm(formSchema, {
    defaultValues: {
      categories: [newItem],
    },
  });

  useEffect(() => {
    form.reset({
      categories: [newItem],
    });
  }, [isOpen, form]);

  const onSubmit = (data: CreateCategoriesFormValues) => {
    categoriesMutation.mutate(data.categories);
  };

  const { fields, append } = useFieldArray({
    name: "categories",
    control: form.control,
  });

  return (
    <DialogContent className="max-w-[455px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-4">
            <DialogHeader className="mb-4">
              <DialogTitle>Create categories</DialogTitle>
              <DialogDescription>
                You can add your own categories here.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-6 max-h-[420px] overflow-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col space-y-2">
                  <FormField
                    control={form.control}
                    name={`categories.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-1">
                        <FormLabel className="text-xs text-[#878787] font-normal">
                          Name
                        </FormLabel>
                        <FormControl>
                          <InputColor
                            autoFocus
                            placeholder="Name"
                            onChange={({ name, color }) => {
                              field.onChange(name);
                              form.setValue(`categories.${index}.color`, color);
                            }}
                            defaultValue={field.value}
                            defaultColor={form.watch(
                              `categories.${index}.color`,
                            )}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`categories.${index}.description`}
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
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`categories.${index}.taxReportingCode`}
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
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex relative gap-2">
                    <FormField
                      control={form.control}
                      name={`categories.${index}.taxType`}
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
                      name={`categories.${index}.taxRate`}
                      render={({ field }) => (
                        <FormItem className="flex-1 space-y-1">
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Tax Rate
                          </FormLabel>
                          <FormControl>
                            <TaxRateInput
                              value={field.value}
                              name={
                                form.watch(`categories.${index}.name`) ?? ""
                              }
                              onChange={(value: string) => {
                                field.onChange(
                                  value ? Number(value) : undefined,
                                );
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

                  <div className="flex relative gap-2">
                    <span className="text-xs text-muted-foreground flex-1">
                      {
                        taxTypes.find(
                          (taxType) =>
                            taxType.value ===
                            form.watch(`categories.${index}.taxType`),
                        )?.description
                      }
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name={`categories.${index}.excluded`}
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-1">
                        <div className="border border-border p-3 mt-2">
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
              ))}
            </div>

            <Button
              variant="outline"
              type="button"
              className="mt-4 space-x-1"
              onClick={() => {
                append(newItem);
              }}
            >
              <Icons.Add />
              <span>Add more</span>
            </Button>

            <DialogFooter className="border-t-[1px] pt-4 mt-8 items-center !justify-between">
              <div>
                {Object.values(form.formState.errors).length > 0 && (
                  <span className="text-sm text-destructive">
                    Please complete the fields above.
                  </span>
                )}
              </div>
              <SubmitButton isSubmitting={categoriesMutation.isPending}>
                Create
              </SubmitButton>
            </DialogFooter>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
