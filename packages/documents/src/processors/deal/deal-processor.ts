import { createLoggerWithContext } from "@midday/logger";
import type { z } from "zod/v4";
import { dealConfig } from "../../config/extraction-config";
import type { GetDocumentRequest } from "../../types";
import { extractWebsite } from "../../utils";
import {
  applyDealFixes,
  validateDealConsistency,
} from "../../utils/cross-field-validation";
import { detectDealFormat } from "../../utils/format-detection";
import type { DocumentFormat } from "../../utils/format-detection";
import {
  calculateExtractionConfidence,
  mergeDealResults,
} from "../../utils/merging";
import {
  calculateQualityScore,
  getFieldsNeedingReExtraction,
} from "../../utils/validation";
import { BaseExtractionEngine } from "../base-extraction-engine";

type DealData = z.infer<typeof dealConfig.schema>;

export class DealProcessor extends BaseExtractionEngine<
  typeof dealConfig.schema
> {
  constructor() {
    super(dealConfig, createLoggerWithContext("DealProcessor"));
  }

  protected getDocumentType(): string {
    return "deal";
  }

  protected calculateQualityScore(result: DealData): {
    score: number;
    issues: string[];
    missingCriticalFields: string[];
    invalidFields: string[];
  } {
    return calculateQualityScore(result);
  }

  protected getFieldsNeedingReExtraction(result: DealData): string[] {
    return getFieldsNeedingReExtraction(result);
  }

  protected mergeResults(
    primary: DealData,
    secondary: Partial<DealData>,
  ): DealData {
    return mergeDealResults(primary, secondary);
  }

  protected validateConsistency(result: DealData): {
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
    return validateDealConsistency(result);
  }

  protected applyConsistencyFixes(
    result: DealData,
    fixes: Array<{ field: string; value: any; reason: string }>,
  ): DealData {
    return applyDealFixes(result, fixes);
  }

  protected detectFormat(result: DealData): DocumentFormat | undefined {
    return detectDealFormat(result);
  }

  protected calculateConfidence(
    result: DealData,
    qualityScore: {
      score: number;
      missingCriticalFields: string[];
    },
  ): number {
    return calculateExtractionConfidence(result, qualityScore);
  }

  protected mergeResultsWithConfidence(
    primary: DealData,
    secondary: Partial<DealData>,
    primaryConfidence: number,
    secondaryConfidence: number,
  ): DealData {
    return mergeDealResults(
      primary,
      secondary,
      primaryConfidence,
      secondaryConfidence,
    );
  }

  async #getWebsite({
    website,
    email,
    name,
  }: {
    website: string | null;
    email: string | null;
    name: string | null;
  }) {
    return extractWebsite(website, email, name, this.logger);
  }

  public async getDeal(params: GetDocumentRequest) {
    if (!params.documentUrl) {
      throw new Error("Document URL is required");
    }

    const result = await this.extract(params.documentUrl, {
      companyName: params.companyName,
      logger: this.logger,
    });

    const website = await this.#getWebsite({
      website: result.data.website,
      email: result.data.customer_email,
      name: result.data.customer_name,
    });

    return {
      ...result.data,
      website,
      type: "deal",
      date: result.data.deal_date,
      amount: result.data.amount,
      currency: result.data.currency,
      name: result.data.customer_name,
      tax_amount: result.data.tax_amount,
      tax_rate: result.data.tax_rate,
      tax_type: result.data.tax_type,
      language: result.data.language,
    };
  }
}
