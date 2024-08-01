import {
  type AnalyzeResultOperationOutput,
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";
import { capitalCase } from "change-case";
import type { Processor } from "../../interface";
import { client } from "../../provider/azure";
import type { GetDocumentRequest } from "../../types";
import {
  extractRootDomain,
  getCurrency,
  getDomainFromEmail,
} from "../../utils";

export class InvoiceProcessor implements Processor {
  async #processDocument(content: string) {
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-invoice")
      .post({
        contentType: "application/json",
        body: {
          base64Source: content,
        },
        queryParameters: {
          features: ["queryFields"],
          queryFields: ["VendorEmail", "CustomerEmail"],
          split: "none",
        },
      });

    if (isUnexpected(initialResponse)) {
      throw initialResponse.body.error;
    }
    const poller = await getLongRunningPoller(client, initialResponse);
    const result = (await poller.pollUntilDone())
      .body as AnalyzeResultOperationOutput;

    const invoice = result?.analyzeResult?.documents?.at(0)?.fields;

    const website =
      // First try to get the email domain
      getDomainFromEmail(invoice?.VendorEmail?.valueString) ||
      // Then try to get the website from the content
      extractRootDomain(result?.analyzeResult?.content) ||
      null;

    return {
      name:
        (invoice?.VendorName?.valueString &&
          capitalCase(invoice?.VendorName?.valueString)) ??
        null,
      date:
        invoice?.DueDate?.valueDate || invoice?.InvoiceDate?.valueDate || null,
      currency: getCurrency(invoice?.InvoiceTotal),
      amount: invoice?.InvoiceTotal?.valueCurrency?.amount ?? null,
      website,
    };
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
