/**
 * Custom error classes for recurring invoice processing.
 * Provides typed errors with codes for better error handling and debugging.
 */

/**
 * Error codes for recurring invoice failures
 */
export type RecurringInvoiceErrorCode =
  | "CUSTOMER_NO_EMAIL"
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_DELETED"
  | "TEMPLATE_INVALID"
  | "INVOICE_EXISTS"
  | "DATABASE_ERROR"
  | "GENERATION_FAILED";

/**
 * Typed error class for recurring invoice failures.
 * Provides structured error information for logging and recovery.
 */
export class RecurringInvoiceError extends Error {
  public readonly code: RecurringInvoiceErrorCode;
  public readonly recurringId: string;
  public readonly teamId?: string;
  public readonly customerId?: string;

  constructor(
    code: RecurringInvoiceErrorCode,
    recurringId: string,
    message: string,
    options?: {
      teamId?: string;
      customerId?: string;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "RecurringInvoiceError";
    this.code = code;
    this.recurringId = recurringId;
    this.teamId = options?.teamId;
    this.customerId = options?.customerId;
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
      this.code === "CUSTOMER_NO_EMAIL" ||
      this.code === "CUSTOMER_NOT_FOUND" ||
      this.code === "CUSTOMER_DELETED" ||
      this.code === "TEMPLATE_INVALID"
    );
  }

  /**
   * Get a user-friendly description of the error
   */
  getUserMessage(): string {
    switch (this.code) {
      case "CUSTOMER_NO_EMAIL":
        return "The customer associated with this recurring invoice series does not have an email address. Please update the customer profile.";
      case "CUSTOMER_NOT_FOUND":
        return "The customer associated with this recurring invoice series was not found. They may have been deleted.";
      case "CUSTOMER_DELETED":
        return "The customer associated with this recurring invoice series has been deleted. Please assign a new customer or cancel the series.";
      case "TEMPLATE_INVALID":
        return "The invoice template data is invalid or corrupted. Please recreate the recurring invoice series.";
      case "INVOICE_EXISTS":
        return "An invoice was already generated for this period. Skipping duplicate generation.";
      case "DATABASE_ERROR":
        return "A database error occurred. The system will retry automatically.";
      case "GENERATION_FAILED":
        return "Invoice generation failed. The system will retry automatically.";
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
      customerId: this.customerId,
      isRecoverable: this.isRecoverable,
      requiresUserAction: this.requiresUserAction,
      stack: this.stack,
    };
  }
}

/**
 * Factory functions for creating specific error types
 */
export const RecurringInvoiceErrors = {
  customerNoEmail(
    recurringId: string,
    customerName: string | null,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "CUSTOMER_NO_EMAIL",
      recurringId,
      `Cannot generate recurring invoice: Customer ${customerName || "unknown"} has no email address. Please update the customer profile.`,
      { teamId },
    );
  },

  customerNotFound(
    recurringId: string,
    customerId: string,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "CUSTOMER_NOT_FOUND",
      recurringId,
      `Cannot generate recurring invoice: Customer ${customerId} not found. They may have been deleted.`,
      { teamId, customerId },
    );
  },

  customerDeleted(
    recurringId: string,
    customerName: string | null,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "CUSTOMER_DELETED",
      recurringId,
      `Cannot generate recurring invoice: The customer${customerName ? ` "${customerName}"` : ""} has been deleted. Please assign a new customer or cancel the series.`,
      { teamId },
    );
  },

  templateInvalid(
    recurringId: string,
    reason: string,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "TEMPLATE_INVALID",
      recurringId,
      `Recurring series has invalid template data: ${reason}`,
      { teamId },
    );
  },

  invoiceExists(
    recurringId: string,
    invoiceId: string,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "INVOICE_EXISTS",
      recurringId,
      `Invoice ${invoiceId} already exists for this recurring series period`,
      { teamId },
    );
  },

  databaseError(
    recurringId: string,
    cause: Error,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "DATABASE_ERROR",
      recurringId,
      `Database error during recurring invoice generation: ${cause.message}`,
      { teamId, cause },
    );
  },

  generationFailed(
    recurringId: string,
    cause: Error,
    teamId?: string,
  ): RecurringInvoiceError {
    return new RecurringInvoiceError(
      "GENERATION_FAILED",
      recurringId,
      `Failed to generate recurring invoice: ${cause.message}`,
      { teamId, cause },
    );
  },
};
