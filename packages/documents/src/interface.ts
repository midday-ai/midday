import type { GetDocumentRequest, GetDealOrReceiptResponse } from "./types";

export interface Processor {
  getDealOrReceipt?: (
    params: GetDocumentRequest,
  ) => Promise<GetDealOrReceiptResponse>;
}
