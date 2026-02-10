import { createLoggerWithContext } from "@midday/logger";
import type { z } from "zod/v4";
import { receiptConfig } from "../../config/extraction-config";
import type { GetDocumentRequest } from "../../types";
import { extractWebsite } from "../../utils";
import {
  applyReceiptFixes,
  validateReceiptConsistency,
} from "../../utils/cross-field-validation";
import type { DocumentFormat } from "../../utils/format-detection";
import { detectReceiptFormat } from "../../utils/format-detection";
import {
  calculateReceiptExtractionConfidence,
  mergeReceiptResults,
} from "../../utils/merging";
import {
  calculateReceiptQualityScore,
  getReceiptFieldsNeedingReExtraction,
} from "../../utils/validation";
import { BaseExtractionEngine } from "../base-extraction-engine";

type ReceiptData = z.infer<typeof receiptConfig.schema>;

export class ReceiptProcessor extends BaseExtractionEngine<
  typeof receiptConfig.schema
> {
  constructor() {
    super(receiptConfig, createLoggerWithContext("ReceiptProcessor"));
  }

  protected getDocumentType(): string {
    return "receipt";
  }

  protected calculateQualityScore(result: ReceiptData): {
    score: number;
    issues: string[];
    missingCriticalFields: string[];
    invalidFields: string[];
  } {
    return calculateReceiptQualityScore(result);
  }

  protected getFieldsNeedingReExtraction(result: ReceiptData): string[] {
    return getReceiptFieldsNeedingReExtraction(result);
  }

  protected mergeResults(
    primary: ReceiptData,
    secondary: Partial<ReceiptData>,
  ): ReceiptData {
    return mergeReceiptResults(primary, secondary);
  }

  protected validateConsistency(result: ReceiptData): {
    isValid: boolean;
    issues: Array<{
      field: string;
      issue: string;
      severity: "error" | "warning";
    }>;
    suggestedFixes: Array<{
      field: string;
      value: any;
      reason: string;
    }>;
  } {
    return validateReceiptConsistency(result);
  }

  protected applyConsistencyFixes(
    result: ReceiptData,
    fixes: Array<{ field: string; value: any; reason: string }>,
  ): ReceiptData {
    return applyReceiptFixes(result, fixes);
  }

  protected detectFormat(result: ReceiptData): DocumentFormat | undefined {
    return detectReceiptFormat(result);
  }

  protected calculateConfidence(
    result: ReceiptData,
    qualityScore: {
      score: number;
      missingCriticalFields: string[];
    },
  ): number {
    return calculateReceiptExtractionConfidence(result, qualityScore);
  }

  protected mergeResultsWithConfidence(
    primary: ReceiptData,
    secondary: Partial<ReceiptData>,
    primaryConfidence: number,
    secondaryConfidence: number,
  ): ReceiptData {
    return mergeReceiptResults(
      primary,
      secondary,
      primaryConfidence,
      secondaryConfidence,
    );
  }

  async #getWebsite({
    website,
    email,
    storeName,
  }: {
    website: string | null;
    email: string | null;
    storeName: string | null;
  }) {
    return extractWebsite(website, email, storeName, this.logger);
  }

  public async getReceipt(params: GetDocumentRequest) {
    if (!params.documentUrl) {
      throw new Error("Document URL is required");
    }

    const result = await this.extract(params.documentUrl, {
      companyName: params.companyName,
      logger: this.logger,
    });

    const website = await this.#getWebsite({
      website: result.data.website,
      email: result.data.email,
      storeName: result.data.store_name,
    });

    return {
      ...result.data,
      website,
      type: "expense",
      document_type: result.data.document_type,
      date: result.data.date,
      amount: result.data.total_amount,
      currency: result.data.currency,
      name: result.data.store_name,
      tax_amount: result.data.tax_amount,
      tax_rate: result.data.tax_rate,
      tax_type: result.data.tax_type,
      language: result.data.language,
      metadata: {
        register_number: result.data.register_number ?? null,
        cashier_name: result.data.cashier_name ?? null,
        email: result.data.email ?? null,
      },
    };
  }
}
