const prefix = "INV";

export const generateInvoiceNumber = (count: number) => {
  const nextInvoiceNumber = count > 1 ? count + 1 : 1;

  let paddedCount: string;

  if (nextInvoiceNumber < 10) {
    paddedCount = `000${nextInvoiceNumber}`;
  } else if (nextInvoiceNumber < 100) {
    paddedCount = `00${nextInvoiceNumber}`;
  } else if (nextInvoiceNumber < 1000) {
    paddedCount = `0${nextInvoiceNumber}`;
  } else {
    paddedCount = nextInvoiceNumber.toString();
  }

  return `${prefix}-${paddedCount}`;
};
