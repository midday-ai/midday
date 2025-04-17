export type GetDocumentRequest = {
  content?: string;
  documentUrl?: string;
  mimetype: string;
};

export type GetInvoiceOrReceiptResponse = {
  name?: string | null;
  date?: string | null;
  amount?: number | null;
  currency?: string | null;
  website?: string | null;
  type?: string | null;
  description?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface Attachment {
  ContentLength: number;
  Content: string;
  Name: string;
  ContentType: string;
  ContentID: string;
}

export type Attachments = Attachment[];
