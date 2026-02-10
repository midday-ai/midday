"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { uniqueCurrencies } from "@midday/location/currencies";
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
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v3";
import { SelectCurrency } from "@/components/select-currency";
import { useProductParams } from "@/hooks/use-product-params";
import { useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  unit: z.string().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  data?: RouterOutputs["invoiceProducts"]["getById"];
  defaultCurrency?: string;
};

export function ProductForm({ data, defaultCurrency }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useProductParams();
  const { data: team } = useTeamQuery();

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      description: data?.description || "",
      price: data?.price || undefined,
      unit: data?.unit || "",
      currency:
        data?.currency || defaultCurrency || team?.baseCurrency || "USD",
      isActive: data?.isActive ?? true,
    },
  });

  const createProductMutation = useMutation(
    trpc.invoiceProducts.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
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
      description: productData.description?.trim() || null,
      price: productData.price || null,
      unit: productData.unit?.trim() || null,
      currency: productData.currency || undefined,
      isActive: productData.isActive ?? true,
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
                  value={field.value || ""}
                  placeholder="Product description (optional)"
                  rows={3}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>
                This is for internal use only and won't appear on invoices.
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
                      field.onChange(values.floatValue || undefined);
                    }}
                    allowNegative={false}
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
                    value={field.value || ""}
                    placeholder="e.g., hour, piece, kg"
                    autoComplete="off"
                    onChange={(e) => field.onChange(e.target.value)}
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

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <SelectCurrency
                  currencies={uniqueCurrencies}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Currency for this product's pricing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <div className="border border-border p-3">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">
                      Active Status
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      {field.value
                        ? "Product is active and can be used in invoices"
                        : "Product is inactive and won't appear in invoice suggestions"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex-1" />
        <div className="pt-6 border-t mt-auto">
          <SubmitButton
            isSubmitting={
              createProductMutation.isPending || updateProductMutation.isPending
            }
            className="w-full"
          >
            {data ? "Update" : "Create"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
