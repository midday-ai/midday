import {
  type AnalyzeResultOperationOutput,
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";
import { capitalCase } from "change-case";
import type { Processor } from "../../interface";
import { client } from "../../provider/azure";
import type { GetDocumentRequest } from "../../types";
import { getCurrency } from "../../utils";

export class ExpenseProcessor implements Processor {
  async #processDocument(content: string) {
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-receipt")
      .post({
        contentType: "application/json",
        body: {
          base64Source: content,
        },
      });

    if (isUnexpected(initialResponse)) {
      throw initialResponse.body.error;
    }
    const poller = await getLongRunningPoller(client, initialResponse);
    const result = (await poller.pollUntilDone())
      .body as AnalyzeResultOperationOutput;

    const receipt = result?.analyzeResult?.documents?.at(0)?.fields;

    return {
      name:
        (receipt?.MerchantName?.valueString &&
          capitalCase(receipt?.MerchantName?.valueString)) ??
        null,
      date: receipt?.TransactionDate?.valueDate || null,
      currency: getCurrency(receipt?.Total),
      amount: receipt?.Total?.valueCurrency?.amount ?? null,
      website: null,
    };
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
