import type { Processor } from "../../interface";
import { GoogleDocumentClient, credentials } from "../../providers/google";
import type { GetDocumentRequest } from "../../types";
import { findValue } from "../../utils";

export class ExpenseProcessor implements Processor {
  async #processDocumentWithMain(content: string) {
    const [result] = await GoogleDocumentClient.processDocument({
      name: `projects/${credentials.project_id}/locations/eu/processors/${process.env.GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID}`,
      rawDocument: {
        content,
        mimeType: "image/jpeg",
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

  async #processDocumentSecondary(content: string) {
    return {
      name: null,
      date: null,
      currency: null,
      amount: null,
      meta: null,
    };
  }

  public async getDocument(params: GetDocumentRequest) {
    const main = await this.#processDocumentWithMain(params.content);

    if (!main.amount) {
      const secondary = await this.#processDocumentSecondary(params.content);

      return {
        ...main,
        ...secondary,
      };
    }

    return main;
  }
}
