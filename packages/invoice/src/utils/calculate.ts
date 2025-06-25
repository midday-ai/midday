export function calculateTotal({
	lineItems,
	taxRate = 0,
	vatRate = 0,
	discount = 0,
	includeVat = true,
	includeTax = true,
}: {
	lineItems: Array<{ price?: number; quantity?: number }>;
	taxRate?: number;
	vatRate?: number;
	discount?: number;
	includeVat?: boolean;
	includeTax?: boolean;
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

	// Calculate Total: Subtotal + VAT - Discount
	const total = subTotal + (includeVat ? totalVAT : 0) - safeDiscount;

	// Calculate tax (if included)
	const tax = includeTax ? (total * safeTaxRate) / 100 : 0;

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
	// Handle cases where undefined is explicitly passed
	const safePrice = price ?? 0;
	const safeQuantity = quantity ?? 0;

	// Calculate and return total price
	return safePrice * safeQuantity;
}
