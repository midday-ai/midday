// Define a generic merchant interface to avoid circular dependencies
interface MerchantData {
  name?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  vatNumber?: string | null;
}

export const transformMerchantToContent = (merchant?: MerchantData | null) => {
  if (!merchant) return null;

  const content = [];

  if (merchant.name) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: merchant.name,
          type: "text",
        },
      ],
    });
  }

  if (merchant.addressLine1) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.addressLine1, type: "text" }],
    });
  }

  if (merchant.addressLine2) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.addressLine2, type: "text" }],
    });
  }

  if (merchant.zip || merchant.city) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: `${merchant.zip || ""} ${merchant.city || ""}`.trim(),
          type: "text",
        },
      ],
    });
  }

  if (merchant.country) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.country, type: "text" }],
    });
  }

  if (merchant.email) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.email, type: "text" }],
    });
  }

  if (merchant.phone) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.phone, type: "text" }],
    });
  }

  if (merchant.vatNumber) {
    content.push({
      type: "paragraph",
      content: [{ text: merchant.vatNumber, type: "text" }],
    });
  }

  return {
    type: "doc",
    content,
  };
};
