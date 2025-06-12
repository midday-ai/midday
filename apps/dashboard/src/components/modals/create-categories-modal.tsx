import { InputColor } from "@/components/input-color";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { getTaxTypeForCountry, taxTypes } from "@midday/utils/tax";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
}

interface CreateCategoriesFormValues {
  categories: CategoryFormValues[];
}

const createCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      color: z.string().optional(),
      taxRate: z.number().optional(),
      taxType: z.string().optional(),
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
  };

  const form = useForm<CreateCategoriesFormValues>({
    resolver: zodResolver(createCategoriesSchema),
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

            <div className="flex flex-col space-y-6 max-h-[400px] overflow-auto">
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

                  <span className="text-xs text-muted-foreground">
                    {
                      taxTypes.find(
                        (taxType) =>
                          taxType.value ===
                          form.watch(`categories.${index}.taxType`),
                      )?.description
                    }
                  </span>

                  <FormField
                    control={form.control}
                    name={`categories.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1 !mt-4 space-y-1">
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
              <Button type="submit" disabled={categoriesMutation.isPending}>
                {categoriesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
