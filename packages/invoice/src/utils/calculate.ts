export function calculateTotal({
  lineItems,
  taxRate = 0,
  vatRate = 0,
  discount = 0,
  includeVAT = true,
  includeTax = true,
}: {
  lineItems: Array<{ price?: number; quantity?: number }>;
  taxRate?: number;
  vatRate?: number;
  discount?: number;
  includeVAT?: boolean;
  includeTax?: boolean;
}) {
  // Calculate Subtotal: Sum of all Base Prices for line items
  const subTotal = lineItems.reduce((acc, item) => {
    return acc + (item.price ?? 0) * (item.quantity ?? 0);
  }, 0);

  // Calculate VAT (Total): Calculate VAT on the Subtotal
  const totalVAT = includeVAT ? (subTotal * vatRate) / 100 : 0;

  // Calculate Total: Subtotal + VAT - Discount
  const total = subTotal + (includeVAT ? totalVAT : 0) - discount;

  // Calculate tax (if included)
  const tax = includeTax ? (total * taxRate) / 100 : 0;

  return {
    subTotal,
    total: total + tax,
    vat: totalVAT,
    tax,
  };
}

export function calculateLineItemTotal({
  price = 0,
  quantity = 0,
}: {
  price?: number;
  quantity?: number;
}) {
  // Calculate and return total price
  return price * quantity;
}
