export type Document = {
  content: string;
  mimeType: string;
  size: number;
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
  name?: string;
  date?: string;
  amount?: number;
  currency?: string;
  meta: unknown;
};
