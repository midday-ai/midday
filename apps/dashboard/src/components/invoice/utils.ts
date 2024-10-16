import type { Customer } from "./customer-details";

export const transformCustomerToContent = (customer?: Customer) => {
  if (!customer) return null;

  const content = [];

  if (customer.name) {
    content.push({ text: customer.name, type: "text" }, { type: "hardBreak" });
  }
  if (customer.email) {
    content.push({ text: customer.email, type: "text" }, { type: "hardBreak" });
  }
  if (customer?.phone) {
    content.push({ text: customer.phone, type: "text" }, { type: "hardBreak" });
  }
  if (customer?.address_line_1) {
    content.push(
      {
        text:
          customer.address_line_1 + (customer.zip ? `, ${customer.zip}` : ""),
        type: "text",
      },
      { type: "hardBreak" },
    );
  }
  if (customer?.city && customer?.country) {
    content.push(
      { text: `${customer.city}, ${customer.country}`, type: "text" },
      { type: "hardBreak" },
    );
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content,
      },
    ],
  };
};
