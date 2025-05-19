import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
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
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InputColor } from "../input-color";
import { VatInput } from "../vat-input";

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  defaultValue: {
    name: string;
    color: string | null;
    description?: string | null;
    vat?: number | null;
  };
};

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  vat: z.number().optional().nullable(),
});

type UpdateCategoriesFormValues = z.infer<typeof updateCategorySchema>;

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

  const form = useForm<UpdateCategoriesFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      id,
      name: defaultValue.name,
      color: defaultValue.color,
      description: defaultValue.description ?? undefined,
      vat: defaultValue?.vat ? Number(defaultValue.vat) : undefined,
    },
  });

  function onSubmit(values: UpdateCategoriesFormValues) {
    updateCategoryMutation.mutate({
      ...values,
      description: values.description ?? null,
      vat: values.vat ? (values.vat > 0 ? values.vat : null) : null,
      color: values.color ?? null,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 mb-6">
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <div
                              className="size-3 transition-colors rounded-[2px] absolute top-3 left-2"
                              style={{
                                backgroundColor:
                                  form.watch("color") ?? undefined,
                              }}
                            />

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

                  <div className="flex-1 relative">
                    <FormField
                      control={form.control}
                      name="vat"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <VatInput
                              value={field.value}
                              name={form.watch("name")}
                              onChange={(vat) => {
                                field.onChange(+vat);
                              }}
                              onSelect={(vat) => {
                                if (vat) {
                                  form.setValue("vat", +vat);
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex-1">
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
              </div>

              <DialogFooter className="mt-8 w-full">
                <div className="space-y-4 w-full">
                  <Button
                    disabled={updateCategoryMutation.isPending}
                    className="w-full"
                    type="submit"
                  >
                    {updateCategoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
