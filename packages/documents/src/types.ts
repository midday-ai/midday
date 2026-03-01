export type GetDocumentRequest = {
  documentUrl: string;
  mimetype: string;
  companyName?: string | null;
};

export type GetInvoiceOrReceiptResponse = {
  name: string | null;
  date: string | null;
  amount: number | null;
  currency: string | null;
  website: string | null;
  type: "invoice" | "expense" | null;
  tax_amount: number | null;
  tax_rate: number | null;
  tax_type: string | null;
  invoice_number: string | null;
  document_type: "invoice" | "receipt" | "other";
  title: string | null;
  summary: string | null;
  tags: string[] | null;
  content: string | null;
  language: string | null;
};

export interface Attachment {
  ContentLength: number;
  Content: string;
  Name: string;
  ContentType: string;
  ContentID: string;
}

export type Attachments = Attachment[];
