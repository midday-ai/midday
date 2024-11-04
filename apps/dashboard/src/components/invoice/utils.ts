import type { Customer } from "./customer-details";

export const transformCustomerToContent = (customer?: Customer) => {
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

  if (customer.vat) {
    content.push({
      type: "paragraph",
      content: [{ text: `VAT: ${customer.vat}`, type: "text" }],
    });
  }

  return {
    type: "doc",
    content,
  };
};
