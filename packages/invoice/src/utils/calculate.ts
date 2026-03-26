export function calculateTotal({
  lineItems,
  taxRate = 0,
  vatRate = 0,
  discount = 0,
  includeVat = true,
  includeTax = true,
  includeLineItemTax = false,
}: {
  lineItems: Array<{ price?: number; quantity?: number; taxRate?: number }>;
  taxRate?: number;
  vatRate?: number;
  discount?: number;
  includeVat?: boolean;
  includeTax?: boolean;
  includeLineItemTax?: boolean;
}) {
  // Handle cases where lineItems might be undefined or null
  const safeLineItems = lineItems || [];

  // Calculate Subtotal: Sum of all Base Prices for line items
  const subTotal = safeLineItems.reduce((acc, item) => {
    // Handle cases where item might be undefined or null
    if (!item) return acc;

    const safePrice = item.price ?? 0;
    const safeQuantity = item.quantity ?? 0;

    return acc + safePrice * safeQuantity;
  }, 0);

  // Handle cases where rates might be undefined
  const safeTaxRate = taxRate ?? 0;
  const safeVatRate = vatRate ?? 0;
  const safeDiscount = discount ?? 0;

  // Calculate VAT (Total): Calculate VAT on the Subtotal
  const totalVAT = includeVat ? (subTotal * safeVatRate) / 100 : 0;

  // Calculate tax based on mode
  let tax = 0;
  if (includeLineItemTax) {
    // Calculate tax per line item and sum
    tax = safeLineItems.reduce((acc, item) => {
      if (!item) return acc;
      const itemTotal = (item.price ?? 0) * (item.quantity ?? 0);
      const itemTaxRate = item.taxRate ?? 0;
      return acc + (itemTotal * itemTaxRate) / 100;
    }, 0);
  } else if (includeTax) {
    // Invoice-level tax (original behavior)
    tax = (subTotal * safeTaxRate) / 100;
  }

  // Calculate Total: Subtotal + VAT + Tax - Discount
  const total = subTotal + (includeVat ? totalVAT : 0) + tax - safeDiscount;

  return {
    subTotal,
    total,
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
  // Handle cases where undefined is explicitly passed
  const safePrice = price ?? 0;
  const safeQuantity = quantity ?? 0;

  // Calculate and return total price
  return safePrice * safeQuantity;
}
