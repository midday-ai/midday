/**
 * Custom error classes for recurring deal processing.
 * Provides typed errors with codes for better error handling and debugging.
 */

/**
 * Error codes for recurring deal failures
 */
export type RecurringDealErrorCode =
  | "MERCHANT_NO_EMAIL"
  | "MERCHANT_NOT_FOUND"
  | "MERCHANT_DELETED"
  | "TEMPLATE_INVALID"
  | "DEAL_EXISTS"
  | "DATABASE_ERROR"
  | "GENERATION_FAILED";

/**
 * Typed error class for recurring deal failures.
 * Provides structured error information for logging and recovery.
 */
export class RecurringDealError extends Error {
  public readonly code: RecurringDealErrorCode;
  public readonly recurringId: string;
  public readonly teamId?: string;
  public readonly merchantId?: string;

  constructor(
    code: RecurringDealErrorCode,
    recurringId: string,
    message: string,
    options?: {
      teamId?: string;
      merchantId?: string;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "RecurringDealError";
    this.code = code;
    this.recurringId = recurringId;
    this.teamId = options?.teamId;
    this.merchantId = options?.merchantId;
  }

  /**
   * Whether this error is recoverable (retrying might help)
   */
  get isRecoverable(): boolean {
    return this.code === "DATABASE_ERROR" || this.code === "GENERATION_FAILED";
  }

  /**
   * Whether this error requires user intervention
   */
  get requiresUserAction(): boolean {
    return (
      this.code === "MERCHANT_NO_EMAIL" ||
      this.code === "MERCHANT_NOT_FOUND" ||
      this.code === "MERCHANT_DELETED" ||
      this.code === "TEMPLATE_INVALID"
    );
  }

  /**
   * Get a user-friendly description of the error
   */
  getUserMessage(): string {
    switch (this.code) {
      case "MERCHANT_NO_EMAIL":
        return "The merchant associated with this recurring deal series does not have an email address. Please update the merchant profile.";
      case "MERCHANT_NOT_FOUND":
        return "The merchant associated with this recurring deal series was not found. They may have been deleted.";
      case "MERCHANT_DELETED":
        return "The merchant associated with this recurring deal series has been deleted. Please assign a new merchant or cancel the series.";
      case "TEMPLATE_INVALID":
        return "The deal template data is invalid or corrupted. Please recreate the recurring deal series.";
      case "DEAL_EXISTS":
        return "A deal was already generated for this period. Skipping duplicate generation.";
      case "DATABASE_ERROR":
        return "A database error occurred. The system will retry automatically.";
      case "GENERATION_FAILED":
        return "Deal generation failed. The system will retry automatically.";
      default:
        return this.message;
    }
  }

  /**
   * Convert to a plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recurringId: this.recurringId,
      teamId: this.teamId,
      merchantId: this.merchantId,
      isRecoverable: this.isRecoverable,
      requiresUserAction: this.requiresUserAction,
      stack: this.stack,
    };
  }
}

/**
 * Factory functions for creating specific error types
 */
export const RecurringDealErrors = {
  merchantNoEmail(
    recurringId: string,
    merchantName: string | null,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "MERCHANT_NO_EMAIL",
      recurringId,
      `Cannot generate recurring deal: Merchant ${merchantName || "unknown"} has no email address. Please update the merchant profile.`,
      { teamId },
    );
  },

  merchantNotFound(
    recurringId: string,
    merchantId: string,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "MERCHANT_NOT_FOUND",
      recurringId,
      `Cannot generate recurring deal: Merchant ${merchantId} not found. They may have been deleted.`,
      { teamId, merchantId },
    );
  },

  merchantDeleted(
    recurringId: string,
    merchantName: string | null,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "MERCHANT_DELETED",
      recurringId,
      `Cannot generate recurring deal: The merchant${merchantName ? ` "${merchantName}"` : ""} has been deleted. Please assign a new merchant or cancel the series.`,
      { teamId },
    );
  },

  templateInvalid(
    recurringId: string,
    reason: string,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "TEMPLATE_INVALID",
      recurringId,
      `Recurring series has invalid template data: ${reason}`,
      { teamId },
    );
  },

  dealExists(
    recurringId: string,
    dealId: string,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "DEAL_EXISTS",
      recurringId,
      `Deal ${dealId} already exists for this recurring series period`,
      { teamId },
    );
  },

  databaseError(
    recurringId: string,
    cause: Error,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "DATABASE_ERROR",
      recurringId,
      `Database error during recurring deal generation: ${cause.message}`,
      { teamId, cause },
    );
  },

  generationFailed(
    recurringId: string,
    cause: Error,
    teamId?: string,
  ): RecurringDealError {
    return new RecurringDealError(
      "GENERATION_FAILED",
      recurringId,
      `Failed to generate recurring deal: ${cause.message}`,
      { teamId, cause },
    );
  },
};
