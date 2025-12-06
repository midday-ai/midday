import type { GetDocumentRequest, GetInvoiceOrReceiptResponse } from "./types";

export interface Processor {
  getInvoiceOrReceipt?: (
    params: GetDocumentRequest,
  ) => Promise<GetInvoiceOrReceiptResponse>;
}
