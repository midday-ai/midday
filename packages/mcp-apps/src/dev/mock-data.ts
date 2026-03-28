export const invoiceData = {
  data: {
    id: "inv_abc123",
    invoiceNumber: "INV-0042",
    status: "draft",
    customerName: "Acme Corp",
    amount: 12500,
    currency: "USD",
    dueDate: "2025-04-15",
    issueDate: "2025-03-26",
    discount: 0,
    template: {
      title: "Invoice",
      logoUrl: "https://midday.ai/email/logo.png",
      customerLabel: "To",
      fromLabel: "From",
      invoiceNoLabel: "Invoice No",
      issueDateLabel: "Issue Date",
      dueDateLabel: "Due Date",
      descriptionLabel: "Description",
      priceLabel: "Price",
      quantityLabel: "Quantity",
      totalLabel: "Total",
      totalSummaryLabel: "Total",
      vatLabel: "VAT",
      subtotalLabel: "Subtotal",
      taxLabel: "Tax",
      discountLabel: "Discount",
      paymentLabel: "Payment Details",
      noteLabel: "Note",
      lineItemTaxLabel: "Tax",
      dateFormat: "dd/MM/yyyy",
      locale: "en-US",
      size: "a4",
      includeVat: true,
      vatRate: 25,
      includeTax: false,
      taxRate: 0,
      includeDiscount: false,
      includeLineItemTax: false,
      includeDecimals: false,
      includeUnits: false,
    },
    lineItems: [
      { name: "Website Design & Development", quantity: 1, price: 8500 },
      { name: "Brand Identity Package", quantity: 1, price: 2500 },
      { name: "SEO Audit & Optimization", quantity: 3, price: 500 },
    ],
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Midday Labs AB", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Storgatan 12" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "111 51 Stockholm, Sweden" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "hello@midday.ai",
              marks: [
                { type: "link", attrs: { href: "mailto:hello@midday.ai" } },
              ],
            },
          ],
        },
      ],
    },
    customerDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Acme Corp", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "1234 Market Street" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "San Francisco, CA 94103" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "United States" }],
        },
      ],
    },
    paymentDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Bank: ", marks: [{ type: "bold" }] },
            { type: "text", text: "Swedbank" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "IBAN: ", marks: [{ type: "bold" }] },
            { type: "text", text: "SE45 5000 0000 0583 9825 7466" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "BIC: ", marks: [{ type: "bold" }] },
            { type: "text", text: "SWEDSESS" },
          ],
        },
      ],
    },
    noteDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Thank you for your business!" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Payment is due within 30 days of the invoice date.",
            },
          ],
        },
      ],
    },
    topBlock: null,
    bottomBlock: null,
  },
};
