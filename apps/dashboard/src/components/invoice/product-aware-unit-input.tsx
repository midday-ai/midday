"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { Input } from "./input";

type Props = {
  name: string;
  lineItemIndex: number;
};

export function ProductAwareUnitInput({
  lineItemIndex,
  name,
  ...props
}: Props) {
  const { watch } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get current line item data
  const lineItemName = watch(`lineItems.${lineItemIndex}.name`);
  const currentPrice = watch(`lineItems.${lineItemIndex}.price`);
  const currentProductId = watch(`lineItems.${lineItemIndex}.productId`);
  const currentUnit = watch(`lineItems.${lineItemIndex}.unit`);
  const currency = watch("template.currency");

  // Mutation for saving line item as product
  const saveLineItemAsProductMutation = useMutation(
    trpc.invoiceProducts.saveLineItemAsProduct.mutationOptions({
      onSuccess: () => {
        // Invalidate products query to get fresh data
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceProducts.get.queryKey(),
        });
      },
    }),
  );

  const handleUnitBlur = () => {
    // Only save if we have a productId (meaning this line item references an existing product)
    if (currentProductId && lineItemName && lineItemName.trim().length > 0) {
      saveLineItemAsProductMutation.mutate({
        name: lineItemName.trim(),
        price: currentPrice !== undefined ? currentPrice : null,
        unit: currentUnit || null,
        productId: currentProductId,
        currency: currency || null,
      });
    }
  };

  return (
    <Input
      {...props}
      name={name}
      onBlur={(_e) => {
        // Update product with new unit
        handleUnitBlur();
      }}
    />
  );
}
