import { capitalCase } from "change-case";
import type { Processor } from "../../interface";
import { GoogleDocumentClient, credentials } from "../../providers/google";
import type { GetDocumentRequest } from "../../types";
import {
  extractDomain,
  findValue,
  getCurrency,
  getDomainFromEmail,
  getInvoiceMetaData,
} from "../../utils";

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

    // Fallback to USD, user can change in settings
    const currency = getCurrency(entities);

    const date =
      findValue(entities, "due_date") ||
      findValue(entities, "invoice_date") ||
      null;
    const foundName = findValue(entities, "supplier_name");
    const name = (foundName && capitalCase(foundName)) || null;
    const amount = findValue(entities, "total_amount") ?? null;
    const email = findValue(entities, "supplier_email") ?? null;
    const website =
      extractDomain(findValue(entities, "supplier_website")) ||
      getDomainFromEmail(email) ||
      null;
    const meta = getInvoiceMetaData(entities);

    return {
      name,
      date,
      currency,
      amount,
      website,
      meta,
    };
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
