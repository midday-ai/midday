/**
 * Storecove E-Invoice Provider
 *
 * Integrates with Storecove's API for sending Peppol e-invoices.
 * API Documentation: https://www.storecove.com/docs/
 */

import { logger } from "@midday/logger";
import {
  type EInvoiceDeliveryStatus,
  type EInvoiceDocument,
  type EInvoiceProvider,
  type EInvoiceProviderConfig,
  EInvoiceOperationError,
  type EInvoiceStatus,
  type PeppolParticipantId,
  type SendEInvoiceResult,
  formatPeppolId,
} from "../types";
import { generateUBLInvoice } from "../ubl";

/**
 * Storecove API base URLs
 */
const STORECOVE_API_URLS = {
  production: "https://api.storecove.com/api/v2",
  sandbox: "https://api-sandbox.storecove.com/api/v2",
} as const;

/**
 * Storecove document submission response
 */
interface StorecoveSubmitResponse {
  guid: string;
}

/**
 * Storecove document status response
 */
interface StorecoveStatusResponse {
  guid: string;
  status:
    | "pending"
    | "sent"
    | "sendError"
    | "acknowledged"
    | "rejected"
    | "delivered";
  created_at: string;
  updated_at: string;
  error_message?: string;
}

/**
 * Storecove participant lookup response
 */
interface StorecoveParticipantResponse {
  identifier: string;
  scheme: string;
  name?: string;
  country?: string;
}

/**
 * Map Storecove status to our status type
 */
function mapStorecoveStatus(status: StorecoveStatusResponse["status"]): EInvoiceStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "sent":
      return "sent";
    case "delivered":
    case "acknowledged":
      return "delivered";
    case "sendError":
    case "rejected":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Storecove provider implementation
 */
export class StorecoveProvider implements EInvoiceProvider {
  readonly name = "Storecove";

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly legalEntityId?: string;

  constructor(config: EInvoiceProviderConfig & { legalEntityId?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = STORECOVE_API_URLS[config.environment];
    this.legalEntityId = config.options?.legalEntityId as string | undefined;
  }

  /**
   * Make an authenticated API request to Storecove
   */
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Storecove API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorBody || errorMessage;
      }

      // Map HTTP status to error type
      if (response.status === 401 || response.status === 403) {
        throw new EInvoiceOperationError({
          type: "auth_failed",
          message: "Storecove authentication failed. Check your API key.",
          code: String(response.status),
          retryable: false,
        });
      }

      if (response.status === 422) {
        throw new EInvoiceOperationError({
          type: "validation",
          message: errorMessage,
          code: "VALIDATION_ERROR",
          retryable: false,
        });
      }

      if (response.status === 429) {
        throw new EInvoiceOperationError({
          type: "rate_limit",
          message: "Rate limited by Storecove. Please try again later.",
          code: "RATE_LIMIT",
          retryable: true,
        });
      }

      if (response.status >= 500) {
        throw new EInvoiceOperationError({
          type: "provider_error",
          message: errorMessage,
          code: String(response.status),
          retryable: true,
        });
      }

      throw new EInvoiceOperationError({
        type: "provider_error",
        message: errorMessage,
        code: String(response.status),
        retryable: false,
      });
    }

    return response.json() as Promise<T>;
  }

  /**
   * Check if the Storecove connection is valid
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Use the legal entities endpoint to verify the API key
      await this.apiCall<unknown>("/legal_entities");
      return { connected: true };
    } catch (error) {
      logger.error("Storecove connection check failed", {
        provider: "storecove",
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Send an e-invoice via Storecove
   */
  async sendInvoice(document: EInvoiceDocument): Promise<SendEInvoiceResult> {
    try {
      // Generate UBL XML
      const ublXml = generateUBLInvoice(document);

      logger.info("Sending e-invoice via Storecove", {
        provider: "storecove",
        invoiceId: document.id,
        buyer: formatPeppolId(document.buyer.peppolId),
        seller: formatPeppolId(document.seller.peppolId),
      });

      // Submit the document
      const response = await this.apiCall<StorecoveSubmitResponse>(
        "/document_submissions",
        {
          method: "POST",
          body: JSON.stringify({
            legal_entity_id: this.legalEntityId,
            document: {
              document_type: document.documentType === "credit_note" ? "creditnote" : "invoice",
              raw_document: ublXml,
              parse: true, // Let Storecove parse the UBL
            },
            routing: {
              // Peppol routing
              eIdentifiers: [
                {
                  scheme: document.buyer.peppolId.scheme,
                  id: document.buyer.peppolId.identifier,
                },
              ],
            },
          }),
        },
      );

      logger.info("E-invoice submitted successfully", {
        provider: "storecove",
        invoiceId: document.id,
        documentId: response.guid,
      });

      return {
        success: true,
        documentId: response.guid,
      };
    } catch (error) {
      logger.error("Failed to send e-invoice via Storecove", {
        provider: "storecove",
        invoiceId: document.id,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof EInvoiceOperationError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send e-invoice",
      };
    }
  }

  /**
   * Get the delivery status of a sent invoice
   */
  async getDeliveryStatus(documentId: string): Promise<EInvoiceDeliveryStatus> {
    try {
      const response = await this.apiCall<StorecoveStatusResponse>(
        `/document_submissions/${documentId}`,
      );

      return {
        documentId,
        status: mapStorecoveStatus(response.status),
        timestamp: response.updated_at,
        error: response.error_message,
        rawStatus: response.status,
      };
    } catch (error) {
      logger.error("Failed to get e-invoice status from Storecove", {
        provider: "storecove",
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Validate if a Peppol ID exists in the network
   */
  async validatePeppolId(peppolId: PeppolParticipantId): Promise<{
    valid: boolean;
    name?: string;
    error?: string;
  }> {
    try {
      const response = await this.apiCall<StorecoveParticipantResponse>(
        `/peppol_identifiers/${peppolId.scheme}/${peppolId.identifier}`,
      );

      return {
        valid: true,
        name: response.name,
      };
    } catch (error) {
      if (error instanceof EInvoiceOperationError && error.type === "validation") {
        return {
          valid: false,
          error: "Peppol ID not found in network",
        };
      }

      logger.error("Failed to validate Peppol ID", {
        provider: "storecove",
        peppolId: formatPeppolId(peppolId),
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        valid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      };
    }
  }
}

