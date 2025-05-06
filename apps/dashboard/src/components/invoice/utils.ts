import type { RouterOutputs } from "@/trpc/routers/_app";
import type { InvoiceFormValues } from "./form-context";

export const transformCustomerToContent = (
  customer?: RouterOutputs["customers"]["getById"],
) => {
  if (!customer) return null;

  const content = [];

  if (customer.name) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: customer.name,
          type: "text",
        },
      ],
    });
  }

  if (customer.address_line_1) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.address_line_1, type: "text" }],
    });
  }

  if (customer.zip || customer.city) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: `${customer.zip || ""} ${customer.city || ""}`.trim(),
          type: "text",
        },
      ],
    });
  }

  if (customer.country) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.country, type: "text" }],
    });
  }

  if (customer.email) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.email, type: "text" }],
    });
  }

  if (customer.phone) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.phone, type: "text" }],
    });
  }

  return {
    type: "doc",
    content,
  };
};

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  return {
    ...values,
    template: {
      ...values.template,
      ...(values.payment_details && {
        payment_details: JSON.stringify(values.payment_details),
      }),
      ...(values.from_details && {
        from_details: JSON.stringify(values.from_details),
      }),
    },
    ...(values.payment_details && {
      payment_details: JSON.stringify(values.payment_details),
    }),
    ...(values.from_details && {
      from_details: JSON.stringify(values.from_details),
    }),
    ...(values.customer_details && {
      customer_details: JSON.stringify(values.customer_details),
    }),
    ...(values.note_details && {
      note_details: JSON.stringify(values.note_details),
    }),
  };
};

export function parseInputValue(value?: string | null) {
  if (value === null) return null;
  return value ? JSON.parse(value) : undefined;
}
