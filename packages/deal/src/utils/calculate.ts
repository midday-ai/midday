export function calculateTotal({
  lineItems,
  discount = 0,
}: {
  lineItems: Array<{ price?: number; quantity?: number }>;
  discount?: number;
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

  const safeDiscount = discount ?? 0;

  // Calculate Total: Subtotal - Discount
  const total = subTotal - safeDiscount;

  return {
    subTotal,
    total,
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
