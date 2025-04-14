import { InvoiceProcessor } from "./processors/invoice/invoice-processor";
import { ReceiptProcessor } from "./processors/receipt/receipt-processor";
import type { GetDocumentRequest, GetInvoiceOrReceiptResponse } from "./types";

export class DocumentClient {
  public async getInvoiceOrReceipt(
    params: GetDocumentRequest,
  ): Promise<GetInvoiceOrReceiptResponse> {
    if (params.documentType === "invoice") {
      const processor = new InvoiceProcessor();
      return processor.getInvoice(params);
    }

    const processor = new ReceiptProcessor();
    return processor.getReceipt(params);
  }
}
