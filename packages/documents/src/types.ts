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
  amount?: string | null;
  currency?: string | null;
  website?: string | null;
  meta?: {
    [key: string]: unknown;
  };
};

export type Entries = {
  normalizedValue?: {
    text: string;
  };
  mentionText?: string;
  type: string;
}[];
