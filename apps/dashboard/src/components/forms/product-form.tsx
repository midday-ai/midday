"use client";

import { useProductParams } from "@/hooks/use-product-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  unit: z.string().optional(),
  currency: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  data?: RouterOutputs["invoiceProducts"]["getById"];
};

export function ProductForm({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useProductParams();

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name || undefined,
      description: data?.description || undefined,
      price: data?.price || undefined,
      unit: data?.unit || undefined,
      currency: data?.currency || "USD",
    },
  });

  const createProductMutation = useMutation(
    trpc.invoiceProducts.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
        setParams(null);
      },
    }),
  );

  const updateProductMutation = useMutation(
    trpc.invoiceProducts.updateProduct.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
        // Invalidate the specific product query
        if (result?.id) {
          queryClient.invalidateQueries({
            queryKey: trpc.invoiceProducts.getById.queryKey({ id: result.id }),
          });
        }
        setParams(null);
      },
      onError: (error) => {
        // Handle different error types based on tRPC error codes
        let message = error.message;

        if (error.data?.code === "CONFLICT") {
          message =
            "A product with this name already exists. Please choose a different name.";
        }

        form.setError("name", {
          type: "manual",
          message,
        });
      },
    }),
  );

  const onSubmit = (values: FormData) => {
    const { id, ...productData } = values;

    const formattedData = {
      ...productData,
      description: productData.description || undefined,
      price: productData.price || undefined,
      unit: productData.unit || undefined,
      currency: productData.currency || undefined,
    };

    // If ID exists, update; otherwise create
    if (id) {
      updateProductMutation.mutate({
        id,
        ...formattedData,
      });
    } else {
      createProductMutation.mutate(formattedData);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 h-[calc(100vh-130px)]"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Product name"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                />
              </FormControl>
              <FormDescription>
                This is the product display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Product description (optional)"
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Optional description of the product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <CurrencyInput
                    min={0}
                    value={field.value}
                    placeholder="0.00"
                    onValueChange={(values) => {
                      field.onChange(values.floatValue);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Default price for this product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., hour, piece, kg"
                    autoComplete="off"
                  />
                </FormControl>
                <FormDescription>
                  Unit of measurement (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex-1" />
        <div className="pt-6 border-t mt-auto">
          <SubmitButton
            isSubmitting={
              createProductMutation.isPending || updateProductMutation.isPending
            }
            className="w-full"
          >
            {data ? "Update" : "Create Product"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
