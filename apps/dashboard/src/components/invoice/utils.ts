import type { RouterOutputs } from "@api/trpc/routers/_app";
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

  if (customer.addressLine1) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.addressLine1, type: "text" }],
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
      ...(values.paymentDetails && {
        paymentDetails: JSON.stringify(values.paymentDetails),
      }),
      ...(values.fromDetails && {
        fromDetails: JSON.stringify(values.fromDetails),
      }),
    },
    ...(values.paymentDetails && {
      paymentDetails: JSON.stringify(values.paymentDetails),
    }),
    ...(values.fromDetails && {
      fromDetails: JSON.stringify(values.fromDetails),
    }),
    ...(values.customerDetails && {
      customerDetails: JSON.stringify(values.customerDetails),
    }),
    ...(values.noteDetails && {
      noteDetails: JSON.stringify(values.noteDetails),
    }),
  };
};
