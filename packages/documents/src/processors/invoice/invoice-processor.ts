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
import { LlmProcessor } from "../llm/llm-processor";

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

    return this.#extractData(result);
  }

  async #extractData(data: AnalyzeResultOperationOutput) {
    const fields = data.analyzeResult?.documents?.[0]?.fields;
    const content = data.analyzeResult?.content;

    const website =
      // First try to get the email domain
      getDomainFromEmail(fields?.VendorEmail?.valueString) ||
      // Then try to get the website from the content
      extractRootDomain(content) ||
      null;

    const result = {
      name:
        (fields?.VendorName?.valueString &&
          capitalCase(fields?.VendorName?.valueString)) ??
        null,
      date:
        fields?.DueDate?.valueDate || fields?.InvoiceDate?.valueDate || null,
      currency: getCurrency(fields?.InvoiceTotal),
      amount: fields?.InvoiceTotal?.valueCurrency?.amount ?? null,
      website,
    };

    if (Object.values(result).every((value) => value !== null)) {
      return result;
    }

    const fallback = content ? await this.#fallbackToLlm(content) : null;

    console.log(fallback);

    // Only replace null values from LLM
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        value ?? fallback?.[key as keyof typeof result],
      ]),
    );
  }

  async #fallbackToLlm(content: string) {
    const llm = new LlmProcessor();

    return llm.getStructuredData(content);
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
