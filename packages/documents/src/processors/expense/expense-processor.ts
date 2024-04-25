import type { Processor } from "../../interface";
import { GoogleDocumentClient, credentials } from "../../providers/google";
import type { GetDocumentRequest } from "../../types";
import { findValue, getDomainFromEmail, getExpenseMetaData } from "../../utils";

export class ExpenseProcessor implements Processor {
  async #processDocument(content: string) {
    const [result] = await GoogleDocumentClient.processDocument({
      name: `projects/${credentials.project_id}/locations/eu/processors/${process.env.GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID}`,
      rawDocument: {
        content,
        mimeType: "image/jpeg",
      },
    });

    const entities = result.document.entities;

    console.log(JSON.stringify(entities, null, 2));

    console.log(JSON.stringify(getExpenseMetaData(entities), null, 2));

    const currency = findValue(entities, "currency") ?? null;
    const date = findValue(entities, "receipt_date") ?? null;
    const name = findValue(entities, "supplier_name") ?? null;
    const amount = findValue(entities, "total_amount") ?? null;
    const email = findValue(entities, "supplier_email") ?? null;
    const website = getDomainFromEmail(email) ?? null;
    const meta = getExpenseMetaData(entities);

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
