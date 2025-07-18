// Define a generic customer interface to avoid circular dependencies
interface CustomerData {
  name?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

export const transformCustomerToContent = (customer?: CustomerData | null) => {
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

  if (customer.addressLine2) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.addressLine2, type: "text" }],
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
