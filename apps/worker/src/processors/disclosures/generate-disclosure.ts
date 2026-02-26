import {
  getDealFeesByDeal,
  getDisclosureById,
  getMcaDealById,
  updateDisclosure,
} from "@midday/db/queries";
import {
  calculateDisclosureFigures,
  hashBuffer,
} from "@midday/disclosures";
import type { DealFee, DealTerms } from "@midday/disclosures/types";
import { getStateConfig } from "@midday/disclosures/states";
import { DisclosurePdfTemplate } from "@midday/disclosures/templates/pdf";
import { createClient } from "@midday/supabase/job";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Job } from "bullmq";
import type { GenerateDisclosurePayload } from "../../schemas/disclosures";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Generate Disclosure Processor
 * Handles PDF generation, hashing, and storage upload for disclosure documents.
 *
 * Flow:
 * 1. Fetch disclosure record + deal + merchant + fees
 * 2. Calculate disclosure figures
 * 3. Render PDF via @react-pdf/renderer
 * 4. SHA-256 hash the PDF buffer
 * 5. Upload to Supabase vault storage
 * 6. Update disclosure record with figures, hash, file path, status
 */
export class GenerateDisclosureProcessor extends BaseProcessor<GenerateDisclosurePayload> {
  async process(job: Job<GenerateDisclosurePayload>): Promise<void> {
    const { disclosureId, dealId, teamId, stateCode } = job.data;
    const db = getDb();
    const supabase = createClient();

    this.logger.info("Starting disclosure generation", {
      jobId: job.id,
      disclosureId,
      dealId,
      stateCode,
    });

    // Update status to generating
    await updateDisclosure(db, {
      id: disclosureId,
      teamId,
      status: "generating",
    });

    // Fetch deal with merchant info
    const deal = await getMcaDealById(db, { id: dealId, teamId });
    if (!deal) {
      await updateDisclosure(db, {
        id: disclosureId,
        teamId,
        status: "failed",
      });
      throw new Error(`Deal not found: ${dealId}`);
    }

    if (!deal.fundedAt || !deal.expectedPayoffDate) {
      await updateDisclosure(db, {
        id: disclosureId,
        teamId,
        status: "failed",
      });
      throw new Error("Deal missing fundedAt or expectedPayoffDate");
    }

    // Get state config
    const stateConfig = getStateConfig(stateCode);
    if (!stateConfig) {
      await updateDisclosure(db, {
        id: disclosureId,
        teamId,
        status: "failed",
      });
      throw new Error(`No state config for: ${stateCode}`);
    }

    // Get fees
    const fees = await getDealFeesByDeal(db, { dealId, teamId });

    const dealTerms: DealTerms = {
      fundingAmount: deal.fundingAmount,
      factorRate: deal.factorRate,
      paybackAmount: deal.paybackAmount,
      dailyPayment: deal.dailyPayment,
      paymentFrequency: (deal.paymentFrequency ?? "daily") as DealTerms["paymentFrequency"],
      fundedAt: deal.fundedAt,
      expectedPayoffDate: deal.expectedPayoffDate,
      fees: fees.map(
        (f): DealFee => ({
          feeType: f.feeType as DealFee["feeType"],
          feeName: f.feeName,
          amount: f.amount,
          percentage: f.percentage,
        }),
      ),
    };

    // Calculate figures
    const figures = calculateDisclosureFigures(dealTerms, stateConfig);

    this.logger.debug("Figures calculated", {
      disclosureId,
      apr: figures.annualPercentageRate,
      financeCharge: figures.financeCharge,
    });

    // Build party info for PDF
    const merchant = (deal as { merchant?: { name?: string; state?: string } }).merchant;
    const partyInfo = {
      dealCode: deal.dealCode,
      merchantName: merchant?.name ?? "Unknown Merchant",
      merchantAddress: "", // TODO: Build from merchant address fields
      merchantState: merchant?.state ?? stateCode,
      funderName: "", // TODO: Get from team settings
      funderAddress: "",
      fundedDate: deal.fundedAt.split("T")[0] ?? deal.fundedAt,
    };

    // Render PDF
    this.logger.debug("Rendering PDF", { disclosureId });
    const pdfDocument = await DisclosurePdfTemplate(
      figures,
      stateConfig,
      partyInfo,
    );

    // @ts-ignore - JSX element type
    const buffer = await renderToBuffer(pdfDocument);

    // Hash the PDF
    const documentHash = hashBuffer(buffer);

    // Upload to Supabase vault
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${deal.dealCode}-${stateCode}-${timestamp}.pdf`;
    const fullPath = `${teamId}/disclosures/${filename}`;

    this.logger.debug("Uploading PDF to storage", {
      disclosureId,
      fullPath,
      fileSize: buffer.length,
    });

    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(fullPath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      this.logger.error("Failed to upload disclosure PDF", {
        disclosureId,
        error: uploadError.message,
      });
      await updateDisclosure(db, {
        id: disclosureId,
        teamId,
        status: "failed",
      });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Update disclosure record
    await updateDisclosure(db, {
      id: disclosureId,
      teamId,
      status: "completed",
      figures: figures as unknown as Record<string, unknown>,
      documentHash,
      filePath: [teamId, "disclosures", filename],
      fileSize: buffer.length,
      generatedAt: new Date().toISOString(),
    });

    this.logger.info("Disclosure generation completed", {
      disclosureId,
      dealId,
      stateCode,
      filename,
      documentHash,
      fileSize: buffer.length,
    });
  }
}
