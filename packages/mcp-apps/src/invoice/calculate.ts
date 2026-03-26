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
  const safeLineItems = lineItems || [];

  const subTotal = safeLineItems.reduce((acc, item) => {
    if (!item) return acc;
    return acc + (item.price ?? 0) * (item.quantity ?? 0);
  }, 0);

  const safeTaxRate = taxRate ?? 0;
  const safeVatRate = vatRate ?? 0;
  const safeDiscount = discount ?? 0;

  const totalVAT = includeVat ? (subTotal * safeVatRate) / 100 : 0;

  let tax = 0;
  if (includeLineItemTax) {
    tax = safeLineItems.reduce((acc, item) => {
      if (!item) return acc;
      const itemTotal = (item.price ?? 0) * (item.quantity ?? 0);
      const itemTaxRate = item.taxRate ?? 0;
      return acc + (itemTotal * itemTaxRate) / 100;
    }, 0);
  } else if (includeTax) {
    tax = (subTotal * safeTaxRate) / 100;
  }

  const total = subTotal + (includeVat ? totalVAT : 0) + tax - safeDiscount;

  return { subTotal, total, vat: totalVAT, tax };
}

export function calculateLineItemTotal({
  price = 0,
  quantity = 0,
}: {
  price?: number;
  quantity?: number;
}) {
  return (price ?? 0) * (quantity ?? 0);
}
