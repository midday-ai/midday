import { format, parseISO } from "date-fns";

interface InvoiceSchemaProps {
  invoiceNumber: string;
  teamName: string;
  amount: number;
  currency: string;
  dueDate: string;
  link: string;
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
}: InvoiceSchemaProps) {
  const formattedDueDate = format(parseISO(dueDate), "yyyy-MM-dd");

  const schema = {
    "@context": "http://schema.org",
    "@type": "Invoice",
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

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
