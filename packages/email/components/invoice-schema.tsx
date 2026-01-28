interface InvoiceSchemaProps {
  invoiceNumber: string;
  teamName: string;
  amount: number;
  currency: string;
  dueDate: string;
  link: string;
  customerId?: string;
}

/**
 * Gmail structured data markup for invoices.
 * This enables Gmail to display action buttons and invoice details in the inbox.
 * @see https://developers.google.com/gmail/markup/reference/invoice
 */
export function InvoiceSchema({
  invoiceNumber,
  teamName,
  amount,
  currency,
  dueDate,
  link,
  customerId,
}: InvoiceSchemaProps) {
  // Extract YYYY-MM-DD from ISO string directly (avoids timezone shifts)
  // Input: "2026-02-15T00:00:00.000Z" -> Output: "2026-02-15"
  const formattedDueDate = dueDate.split("T")[0];

  const schema = {
    "@context": "http://schema.org",
    "@type": "Invoice",
    ...(customerId && { accountId: customerId }),
    confirmationNumber: invoiceNumber,
    broker: {
      "@type": "Organization",
      name: teamName,
    },
    paymentDueDate: formattedDueDate,
    totalPaymentDue: {
      "@type": "PriceSpecification",
      price: amount.toFixed(2),
      priceCurrency: currency,
    },
    url: link,
    potentialAction: {
      "@type": "ViewAction",
      url: link,
      name: "View Invoice",
    },
  };

  return (
    <script type="application/ld+json">{JSON.stringify(schema)}</script>
  );
}
