export function calculateTotal({
  price,
  quantity,
  vat,
  includeVAT,
}: {
  price: number;
  quantity: number;
  vat?: number;
  includeVAT: boolean;
}): number {
  const baseTotal = (price ?? 0) * (quantity ?? 0);
  const vatMultiplier = includeVAT ? 1 + (vat || 0) / 100 : 1;
  return baseTotal * vatMultiplier;
}

export function calculateTotals(
  lineItems: Array<{ price?: number; quantity?: number; vat?: number }>,
) {
  return lineItems.reduce(
    (acc, item) => {
      const itemTotal = (item.price ?? 0) * (item.quantity ?? 0);

      const itemVAT = (itemTotal * (item.vat ?? 0)) / 100;

      return {
        totalAmount: acc.totalAmount + itemTotal,
        totalVAT: acc.totalVAT + itemVAT,
      };
    },
    { totalAmount: 0, totalVAT: 0 },
  );
}
