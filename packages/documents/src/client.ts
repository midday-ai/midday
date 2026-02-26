import { DealProcessor } from "./processors/deal/deal-processor";
import { ReceiptProcessor } from "./processors/receipt/receipt-processor";
import type { GetDocumentRequest, GetDealOrReceiptResponse } from "./types";
import { getDocumentTypeFromMimeType } from "./utils";

export class DocumentClient {
  public async getDealOrReceipt(
    params: GetDocumentRequest,
  ): Promise<GetDealOrReceiptResponse> {
    const documentType = getDocumentTypeFromMimeType(params.mimetype);

    if (documentType === "deal") {
      const processor = new DealProcessor();
      return processor.getDeal(params);
    }

    const processor = new ReceiptProcessor();
    return processor.getReceipt(params);
  }
}
