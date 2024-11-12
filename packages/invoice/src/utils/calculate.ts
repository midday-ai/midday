export function calculateTotal({
  lineItems,
  taxRate = 0,
  discount = 0,
  includeVAT = true,
  includeTax = true,
}: {
  lineItems: Array<{ price?: number; quantity?: number; vat?: number }>;
  taxRate?: number;
  discount?: number;
  includeVAT?: boolean;
  includeTax?: boolean;
}) {
  // Calculate Subtotal: Sum of all Base Prices for line items
  const subTotal = lineItems.reduce((acc, item) => {
    return acc + (item.price ?? 0) * (item.quantity ?? 0);
  }, 0);

  // Calculate VAT (Total): Calculate VAT on the Subtotal
  const totalVAT = includeVAT
    ? lineItems.reduce((acc, item) => {
        const itemTotal = (item.price ?? 0) * (item.quantity ?? 0);
        return acc + (itemTotal * (item.vat ?? 0)) / 100;
      }, 0)
    : 0;

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
  vat = 0,
  includeVAT = true,
}: {
  price?: number;
  quantity?: number;
  vat?: number;
  includeVAT?: boolean;
}) {
  // Calculate base price
  const basePrice = price * quantity;

  // Calculate VAT amount if included
  const vatAmount = includeVAT ? (basePrice * vat) / 100 : 0;

  // Return total including VAT if enabled
  return basePrice + vatAmount;
}
