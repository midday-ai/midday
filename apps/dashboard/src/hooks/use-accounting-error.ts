"use client";

import { useToast } from "@midday/ui/use-toast";
import { useCallback } from "react";

/**
 * Error codes for accounting operations (mirrored from @midday/accounting for client use)
 */
const ACCOUNTING_ERROR_CODES = {
  FINANCIAL_YEAR_MISSING: "FINANCIAL_YEAR_MISSING",
  FINANCIAL_YEAR_SETUP_REQUIRED: "FINANCIAL_YEAR_SETUP_REQUIRED",
  RATE_LIMIT: "RATE_LIMIT",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

type AccountingErrorCode =
  (typeof ACCOUNTING_ERROR_CODES)[keyof typeof ACCOUNTING_ERROR_CODES];

/**
 * User-facing error messages for each accounting error code
 */
const ACCOUNTING_ERROR_MESSAGES: Record<
  AccountingErrorCode,
  {
    title: string;
    description: (provider: string) => string;
  }
> = {
  FINANCIAL_YEAR_MISSING: {
    title: "Missing fiscal year",
    description: (provider) =>
      `The fiscal year for these transactions doesn't exist in ${provider}. Please create it in ${provider} and try again.`,
  },
  FINANCIAL_YEAR_SETUP_REQUIRED: {
    title: "Fiscal year setup required",
    description: (provider) =>
      `No fiscal years are configured in ${provider}. Please create your first fiscal year in ${provider} and try again.`,
  },
  AUTH_EXPIRED: {
    title: "Connection expired",
    description: (provider) =>
      `Your ${provider} connection has expired. Please reconnect your account and try again.`,
  },
  RATE_LIMIT: {
    title: "Rate limit exceeded",
    description: (provider) =>
      `Too many requests to ${provider}. Please wait a moment and try again.`,
  },
  VALIDATION: {
    title: "Validation error",
    description: (provider) =>
      `Some data could not be validated by ${provider}. Please check your transaction details.`,
  },
  NOT_FOUND: {
    title: "Not found",
    description: (provider) =>
      `A required resource was not found in ${provider}. Please check your settings.`,
  },
  SERVER_ERROR: {
    title: "Server error",
    description: (provider) =>
      `${provider} is experiencing issues. Please try again later.`,
  },
  UNKNOWN: {
    title: "Export failed",
    description: (provider) =>
      `Could not export to ${provider}. Please check your connection and try again.`,
  },
};

/**
 * Error object from job result
 */
export type AccountingJobError = {
  code?: AccountingErrorCode | string;
  message?: string;
};

/**
 * Job result structure from accounting export
 */
export type AccountingJobResult = {
  failedCount?: number;
  exportedCount?: number;
  errors?: AccountingJobError[];
};

/**
 * Error info returned by getErrorInfo
 */
type ErrorInfo = {
  title: string;
  description: string;
};

/**
 * Hook for handling accounting export errors
 *
 * Provides utilities for:
 * - Parsing error codes from job results
 * - Showing user-friendly toast messages
 * - Getting error info for custom display
 */
export function useAccountingError() {
  const { toast } = useToast();

  /**
   * Get error info from a list of errors
   * Returns the most relevant error message based on error codes
   */
  const getErrorInfo = useCallback(
    (
      errors: AccountingJobError[] | undefined,
      providerName: string,
    ): ErrorInfo => {
      if (!errors || errors.length === 0) {
        return ACCOUNTING_ERROR_MESSAGES.UNKNOWN.title
          ? {
              title: ACCOUNTING_ERROR_MESSAGES.UNKNOWN.title,
              description:
                ACCOUNTING_ERROR_MESSAGES.UNKNOWN.description(providerName),
            }
          : {
              title: "Export failed",
              description: `Could not export to ${providerName}. Please check your connection and try again.`,
            };
      }

      // Check for known error codes in priority order
      const priorityOrder: AccountingErrorCode[] = [
        ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
        ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_SETUP_REQUIRED,
        ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING,
        ACCOUNTING_ERROR_CODES.RATE_LIMIT,
        ACCOUNTING_ERROR_CODES.VALIDATION,
        ACCOUNTING_ERROR_CODES.NOT_FOUND,
        ACCOUNTING_ERROR_CODES.SERVER_ERROR,
      ];

      for (const code of priorityOrder) {
        const matchingError = errors.find((e) => e.code === code);
        if (matchingError) {
          const errorConfig = ACCOUNTING_ERROR_MESSAGES[code];
          return {
            title: errorConfig.title,
            description: errorConfig.description(providerName),
          };
        }
      }

      // No known error code found, use first error message or default
      const firstError = errors[0];
      if (firstError?.message) {
        return {
          title: "Export failed",
          description: firstError.message,
        };
      }

      return {
        title: ACCOUNTING_ERROR_MESSAGES.UNKNOWN.title,
        description:
          ACCOUNTING_ERROR_MESSAGES.UNKNOWN.description(providerName),
      };
    },
    [],
  );

  /**
   * Show toast for export errors only (no success toast - the UI shows completion state)
   */
  const showExportResult = useCallback(
    (result: AccountingJobResult | null | undefined, providerName: string) => {
      const failedCount = result?.failedCount ?? 0;

      if (failedCount > 0) {
        const { title, description } = getErrorInfo(
          result?.errors,
          providerName,
        );
        toast({
          duration: 8000,
          variant: "error",
          title,
          description,
        });
      }
    },
    [toast, getErrorInfo],
  );

  /**
   * Show toast for job failure (job itself failed, not individual transactions)
   */
  const showJobFailure = useCallback(
    (providerName: string, error?: AccountingJobError) => {
      const { title, description } = error?.code
        ? getErrorInfo([error], providerName)
        : {
            title: "Export failed",
            description: `Could not export to ${providerName}. Please check your connection and try again.`,
          };

      toast({
        duration: 8000,
        variant: "error",
        title,
        description,
      });
    },
    [toast, getErrorInfo],
  );

  /**
   * Show toast for mutation error (failed to start export)
   */
  const showMutationError = useCallback(
    (providerName: string) => {
      toast({
        duration: 6000,
        variant: "error",
        title: "Export failed",
        description: `Could not start export to ${providerName}. Please check your connection and try again.`,
      });
    },
    [toast],
  );

  return {
    getErrorInfo,
    showExportResult,
    showJobFailure,
    showMutationError,
  };
}
