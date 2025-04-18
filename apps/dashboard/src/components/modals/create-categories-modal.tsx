import { InputColor } from "@/components/input-color";
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
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { VatInput } from "../vat-input";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
};

const newItem = {
  name: "",
  description: "",
  vat: undefined,
  color: undefined,
};

interface CategoryFormValues {
  name: string;
  description?: string;
  color?: string;
  vat?: number;
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
      vat: z.number().optional(),
    }),
  ),
});

export function CreateCategoriesModal({ onOpenChange, isOpen }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name={`categories.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <InputColor
                              autoFocus
                              placeholder="Name"
                              onChange={({ name, color }) => {
                                field.onChange(name);
                                form.setValue(
                                  `categories.${index}.color`,
                                  color,
                                );
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

                    <div className="flex-1 relative">
                      <FormField
                        control={form.control}
                        name={`categories.${index}.vat`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <VatInput
                                value={field.value?.toString() ?? ""}
                                name={
                                  form.watch(`categories.${index}.name`) ?? ""
                                }
                                onChange={(value: string) => {
                                  field.onChange(
                                    value ? Number(value) : undefined,
                                  );
                                }}
                                onSelect={(vat) => {
                                  if (vat) {
                                    field.onChange(vat);
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name={`categories.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
