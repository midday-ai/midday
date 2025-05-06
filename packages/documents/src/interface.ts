import type { GetDocumentRequest, GetInvoiceOrReceiptResponse } from "./types";

export interface Processor {
  // getDocument: (params: GetDocumentRequest) => Promise<GetDocumentResponse>;
  getInvoiceOrReceipt?: (
    params: GetDocumentRequest,
  ) => Promise<GetInvoiceOrReceiptResponse>;
}
