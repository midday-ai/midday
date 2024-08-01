export type Document = {
  Content: string;
  ContentType: string;
  ContentLength: number;
  Name: string;
};

export type MimeType = "application/pdf" | "image/jpeg";

export type DocumentResponse = {
  content: Buffer | ArrayBuffer;
  mimeType: MimeType;
  size: number;
  fileName: string;
  name: string;
};

export type DocumentClientParams = {
  contentType: string;
};

export type GetDocumentRequest = {
  content: string;
};

export type GetDocumentResponse = {
  name?: string | null;
  date?: string | null;
  amount?: number | null;
  currency?: string | null;
  website?: string | null;
  meta?: {
    [key: string]: unknown;
  };
};

export interface Attachment {
  ContentLength: number;
  Content: string;
  Name: string;
  ContentType: string;
  ContentID: string;
}

export type Attachments = Attachment[];
