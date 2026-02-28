import { extractDocument } from "./ocr/extract";
import type { GetDocumentRequest, GetInvoiceOrReceiptResponse } from "./types";

export class DocumentClient {
  public async getInvoiceOrReceipt(
    params: GetDocumentRequest,
  ): Promise<GetInvoiceOrReceiptResponse> {
    const { data, content } = await extractDocument({
      documentUrl: params.documentUrl,
      mimetype: params.mimetype,
      companyName: params.companyName,
    });

    return {
      name: data.vendor_name ?? null,
      date: data.invoice_date ?? null,
      amount: data.total_amount ?? null,
      currency: data.currency ?? null,
      website: data.website ?? null,
      type: data.document_type === "receipt" ? "expense" : "invoice",
      tax_amount: data.tax_amount ?? null,
      tax_rate: data.tax_rate ?? null,
      tax_type: data.tax_type ?? null,
      invoice_number: data.invoice_number ?? null,
      document_type: data.document_type ?? "other",
      title: data.title ?? null,
      summary: data.summary ?? null,
      tags: data.tags ?? null,
      content: content || null,
      language: data.language ?? null,
    };
  }
}
