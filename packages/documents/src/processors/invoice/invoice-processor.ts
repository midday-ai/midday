import type { Processor } from "../../interface";
import { GoogleDocumentClient, credentials } from "../../providers/google";
import type { GetDocumentRequest } from "../../types";
import { findValue } from "../../utils";

export class InvoiceProcessor implements Processor {
  async #processDocument(content: string) {
    const [result] = await GoogleDocumentClient.processDocument({
      name: `projects/${credentials.project_id}/locations/eu/processors/${process.env.GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID}`,
      rawDocument: {
        content,
        mimeType: "application/pdf",
      },
    });

    const entities = result.document.entities;

    const currency = findValue(entities, "currency") ?? null;
    const date = findValue(entities, "due_date") ?? null;
    const name = findValue(entities, "supplier_name") ?? null;
    const amount = findValue(entities, "total_amount") ?? null;

    return {
      name,
      date,
      currency,
      amount,
      meta: entities,
    };
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
