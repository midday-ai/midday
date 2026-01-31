/**
 * DDD Invoices API Client
 * https://app.dddinvoices.com/documentation
 */

import { logger } from "@midday/logger";
import type {
  DDDInvoice,
  DDDResponse,
  DDDSaveResult,
  DDDStep,
  ReturnDocType,
} from "./types";

/**
 * Custom error class for DDD API errors
 * Includes the step that failed for better error reporting
 */
export class DDDError extends Error {
  public readonly step?: number;
  public readonly code?: number;

  constructor(message: string, step?: number, code?: number) {
    super(message);
    this.name = "DDDError";
    this.step = step;
    this.code = code;
  }
}

const DDD_API_URL =
  process.env.DDD_INVOICES_API_URL || "https://api.dddinvoices.com";

export interface DDDClientConfig {
  connectionKey: string;
  projectName?: string;
}

export interface DDDSaveOptions {
  /** Workflow steps to execute */
  steps?: DDDStep[];
  /** Documents to return in response */
  returnDoc?: ReturnDocType[];
  /** Complexity level */
  complexity?: "Minimal" | "Full";
}

/**
 * Create a DDD Invoices API client
 */
export function createDDDClient(config: DDDClientConfig) {
  const { connectionKey, projectName = "EUeInvoices" } = config;

  const authHeader = `IoT ${connectionKey}:${projectName}`;

  /**
   * Make an authenticated request to the DDD API
   */
  async function request<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<DDDResponse<T>> {
    const url = `${DDD_API_URL}/api/service/${endpoint}`;

    logger.debug("DDD API request", { endpoint, url });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("DDD API HTTP error", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `DDD API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as DDDResponse<T>;

    if (result.Status === "Error") {
      logger.error("DDD API returned error", {
        reason: result.Reason,
        code: result.Code,
      });
      throw new Error(`DDD API error: ${result.Reason || "Unknown error"}`);
    }

    return result;
  }

  return {
    /**
     * Get a new initialized invoice object
     */
    async getNew(options?: {
      complexity?: "Minimal" | "Full";
      includeInfo?: boolean;
    }): Promise<DDDResponse<{ Invoice: { Invoice: DDDInvoice } }>> {
      return request("EUeInvoices.DDDI_GetNew", {
        Complexity: options?.complexity ?? "Minimal",
        IncludeInfo: options?.includeInfo ?? false,
      });
    },

    /**
     * Save/send an invoice
     * This is the main API for creating and sending e-invoices
     */
    async save(
      invoice: DDDInvoice,
      options?: DDDSaveOptions,
    ): Promise<DDDResponse<DDDSaveResult>> {
      const payload: Record<string, unknown> = {
        Complexity: options?.complexity ?? "Minimal",
        Object: { Invoice: invoice },
      };

      if (options?.steps && options.steps.length > 0) {
        payload.Steps = options.steps;
      }

      if (options?.returnDoc && options.returnDoc.length > 0) {
        payload.ReturnDoc = options.returnDoc;
      }

      return request("EUeInvoices.DDDI_Save", payload);
    },

    /**
     * Execute additional steps on an existing invoice
     */
    async executeSteps(
      invoiceId: string,
      steps: DDDStep[],
      options?: { returnDoc?: ReturnDocType[] },
    ): Promise<DDDResponse<DDDSaveResult>> {
      const payload: Record<string, unknown> = {
        Complexity: "Minimal",
        Id: invoiceId,
        Steps: steps,
      };

      if (options?.returnDoc && options.returnDoc.length > 0) {
        payload.ReturnDoc = options.returnDoc;
      }

      return request("EUeInvoices.DDDI_Save", payload);
    },
  };
}

export type DDDClient = ReturnType<typeof createDDDClient>;

/**
 * Peppol workflow steps
 * Steps: Confirm (35) -> Generate Peppol UBL (55) -> Send to Peppol (80)
 */
export const PEPPOL_STEPS: DDDStep[] = [
  35, // Confirm and lock
  55, // Generate Peppol UBL
  80, // Send to Peppol network
];

/**
 * Send an invoice via Peppol network
 */
export async function sendViaPeppol(
  client: DDDClient,
  invoice: DDDInvoice,
): Promise<{ invoiceId: string; peppolXmlUrl?: string }> {
  logger.info("Sending invoice via Peppol", {
    buyerName: invoice.BuyerName,
    buyerId: invoice.BuyerId,
    amount: invoice.DocTotalAmount,
    currency: invoice.DocCurrencyCode,
  });

  const response = await client.save(invoice, {
    steps: PEPPOL_STEPS,
    returnDoc: ["XMLP"], // Return Peppol XML URL
  });

  if (response.Result?.Status !== "OK") {
    throw new DDDError(
      `Peppol delivery failed: ${response.Result?.Reason || "Unknown error"}`,
      response.Result?.Step,
    );
  }

  const result = response.Result.Result;
  if (!result?.Id) {
    throw new Error("Peppol delivery failed: No invoice ID returned");
  }

  logger.info("Invoice sent via Peppol successfully", {
    dddInvoiceId: result.Id,
    peppolXmlUrl: response.Result.ReturnDoc?.XMLP,
  });

  return {
    invoiceId: result.Id,
    peppolXmlUrl: response.Result.ReturnDoc?.XMLP,
  };
}
