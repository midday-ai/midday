import { createLoggerWithContext } from "@midday/logger";
import type { z } from "zod/v4";
import { invoiceConfig } from "../../config/extraction-config";
import type { GetDocumentRequest } from "../../types";
import { extractWebsite } from "../../utils";
import {
  applyInvoiceFixes,
  validateInvoiceConsistency,
} from "../../utils/cross-field-validation";
import type { DocumentFormat } from "../../utils/format-detection";
import { detectInvoiceFormat } from "../../utils/format-detection";
import {
  calculateExtractionConfidence,
  mergeInvoiceResults,
} from "../../utils/merging";
import {
  calculateQualityScore,
  getFieldsNeedingReExtraction,
} from "../../utils/validation";
import { BaseExtractionEngine } from "../base-extraction-engine";

type InvoiceData = z.infer<typeof invoiceConfig.schema>;

export class InvoiceProcessor extends BaseExtractionEngine<
  typeof invoiceConfig.schema
> {
  constructor() {
    super(invoiceConfig, createLoggerWithContext("InvoiceProcessor"));
  }

  protected getDocumentType(): string {
    return "invoice";
  }

  protected calculateQualityScore(result: InvoiceData): {
    score: number;
    issues: string[];
    missingCriticalFields: string[];
    invalidFields: string[];
  } {
    return calculateQualityScore(result);
  }

  protected getFieldsNeedingReExtraction(result: InvoiceData): string[] {
    return getFieldsNeedingReExtraction(result);
  }

  protected mergeResults(
    primary: InvoiceData,
    secondary: Partial<InvoiceData>,
  ): InvoiceData {
    return mergeInvoiceResults(primary, secondary);
  }

  protected validateConsistency(result: InvoiceData): {
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
    return validateInvoiceConsistency(result);
  }

  protected applyConsistencyFixes(
    result: InvoiceData,
    fixes: Array<{ field: string; value: any; reason: string }>,
  ): InvoiceData {
    return applyInvoiceFixes(result, fixes);
  }

  protected detectFormat(result: InvoiceData): DocumentFormat | undefined {
    return detectInvoiceFormat(result);
  }

  protected calculateConfidence(
    result: InvoiceData,
    qualityScore: {
      score: number;
      missingCriticalFields: string[];
    },
  ): number {
    return calculateExtractionConfidence(result, qualityScore);
  }

  protected mergeResultsWithConfidence(
    primary: InvoiceData,
    secondary: Partial<InvoiceData>,
    primaryConfidence: number,
    secondaryConfidence: number,
  ): InvoiceData {
    return mergeInvoiceResults(
      primary,
      secondary,
      primaryConfidence,
      secondaryConfidence,
    );
  }

  async #getWebsite({
    website,
    email,
    vendorName,
  }: {
    website: string | null;
    email: string | null;
    vendorName: string | null;
  }) {
    return extractWebsite(website, email, vendorName, this.logger);
  }

  public async getInvoice(params: GetDocumentRequest) {
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
      vendorName: result.data.vendor_name,
    });

    return {
      ...result.data,
      website,
      type: "invoice",
      document_type: result.data.document_type,
      description: result.data.notes,
      date: result.data.due_date ?? result.data.invoice_date,
      amount: result.data.total_amount,
      currency: result.data.currency,
      name: result.data.vendor_name,
      tax_amount: result.data.tax_amount,
      tax_rate: result.data.tax_rate,
      tax_type: result.data.tax_type,
      language: result.data.language,
      invoice_number: result.data.invoice_number ?? null,
      metadata: {
        invoice_date: result.data.invoice_date ?? null,
        payment_instructions: result.data.payment_instructions ?? null,
        customer_name: result.data.customer_name ?? null,
        customer_address: result.data.customer_address ?? null,
        vendor_address: result.data.vendor_address ?? null,
        vendor_name: result.data.vendor_name ?? null,
        email: result.data.email ?? null,
      },
    };
  }
}
