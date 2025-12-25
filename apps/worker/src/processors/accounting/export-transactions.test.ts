import { describe, expect, test } from "bun:test";
import { ACCOUNTING_ERROR_CODES } from "@midday/accounting";

/**
 * Derive error code from error message for database storage
 * This allows the frontend to show appropriate error messages
 *
 * Note: This is a copy of the function from export-transactions.ts for testing
 * Since the function is not exported, we test the logic directly here.
 */
function deriveErrorCodeFromMessage(
  errorMessage: string | undefined,
): string | undefined {
  if (!errorMessage) return undefined;

  const messageLower = errorMessage.toLowerCase();

  if (messageLower.includes("rate limit")) {
    return ACCOUNTING_ERROR_CODES.RATE_LIMIT;
  }
  if (
    messageLower.includes("401") ||
    messageLower.includes("unauthorized") ||
    messageLower.includes("authentication failed")
  ) {
    return ACCOUNTING_ERROR_CODES.AUTH_EXPIRED;
  }
  if (
    messageLower.includes("financial year") ||
    messageLower.includes("fiscal year") ||
    messageLower.includes("bokföringsår")
  ) {
    return ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING;
  }
  // Detect invalid account errors from various providers:
  // Xero: "Account code <number> is not valid", "Account code not found"
  // Fortnox: "konto" (Swedish for account), error code 2000106
  // QuickBooks: validation errors mentioning account
  // Also detect errors thrown by our validation
  if (
    (messageLower.includes("account") &&
      (messageLower.includes("invalid") ||
        messageLower.includes("not valid") ||
        messageLower.includes("not found"))) ||
    messageLower.includes("konto") || // Swedish: account
    messageLower.includes("2000106") // Fortnox: alphanumeric validation error
  ) {
    return ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT;
  }
  if (messageLower.includes("validation") || messageLower.includes("400")) {
    return ACCOUNTING_ERROR_CODES.VALIDATION;
  }
  if (messageLower.includes("not found") || messageLower.includes("404")) {
    return ACCOUNTING_ERROR_CODES.NOT_FOUND;
  }
  if (/\b5\d{2}\b/.test(messageLower)) {
    return ACCOUNTING_ERROR_CODES.SERVER_ERROR;
  }

  return ACCOUNTING_ERROR_CODES.UNKNOWN;
}

describe("deriveErrorCodeFromMessage", () => {
  describe("returns undefined for empty/missing messages", () => {
    test("returns undefined for undefined message", () => {
      expect(deriveErrorCodeFromMessage(undefined)).toBeUndefined();
    });

    test("returns undefined for empty string", () => {
      // Empty string is falsy but truthy check is on message existence
      expect(deriveErrorCodeFromMessage("")).toBeUndefined();
    });
  });

  describe("RATE_LIMIT detection", () => {
    test("detects 'rate limit' in message", () => {
      expect(deriveErrorCodeFromMessage("Rate limit exceeded")).toBe(
        ACCOUNTING_ERROR_CODES.RATE_LIMIT,
      );
    });

    test("detects rate limit case-insensitively", () => {
      expect(deriveErrorCodeFromMessage("RATE LIMIT reached")).toBe(
        ACCOUNTING_ERROR_CODES.RATE_LIMIT,
      );
    });
  });

  describe("AUTH_EXPIRED detection", () => {
    test("detects '401' status code", () => {
      expect(deriveErrorCodeFromMessage("HTTP 401 response")).toBe(
        ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
      );
    });

    test("detects 'unauthorized' keyword", () => {
      expect(deriveErrorCodeFromMessage("Unauthorized access")).toBe(
        ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
      );
    });

    test("detects 'authentication failed'", () => {
      expect(deriveErrorCodeFromMessage("Authentication failed")).toBe(
        ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
      );
    });
  });

  describe("FINANCIAL_YEAR_MISSING detection", () => {
    test("detects 'financial year' keyword", () => {
      expect(deriveErrorCodeFromMessage("Financial year does not exist")).toBe(
        ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING,
      );
    });

    test("detects 'fiscal year' keyword", () => {
      expect(deriveErrorCodeFromMessage("Fiscal year not found")).toBe(
        ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING,
      );
    });

    test("detects Swedish 'bokföringsår'", () => {
      expect(deriveErrorCodeFromMessage("Bokföringsår saknas")).toBe(
        ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING,
      );
    });
  });

  describe("INVALID_ACCOUNT detection", () => {
    test("detects 'account' + 'invalid' combination", () => {
      expect(
        deriveErrorCodeFromMessage(
          "Invalid account code '5400'. Fortnox requires 4-digit BAS account codes.",
        ),
      ).toBe(ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT);
    });

    test("detects 'account' + 'not valid' (Xero style)", () => {
      expect(deriveErrorCodeFromMessage("Account code 999 is not valid")).toBe(
        ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
      );
    });

    test("detects 'account' + 'not found' (Xero style)", () => {
      expect(deriveErrorCodeFromMessage("Account code not found")).toBe(
        ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
      );
    });

    test("detects Swedish 'konto' (Fortnox)", () => {
      expect(deriveErrorCodeFromMessage("Ogiltigt konto")).toBe(
        ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
      );
    });

    test("detects Fortnox error code 2000106", () => {
      expect(
        deriveErrorCodeFromMessage("Error 2000106: Value must be alphanumeric"),
      ).toBe(ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT);
    });
  });

  describe("VALIDATION detection", () => {
    test("detects 'validation' keyword", () => {
      expect(deriveErrorCodeFromMessage("Validation error occurred")).toBe(
        ACCOUNTING_ERROR_CODES.VALIDATION,
      );
    });

    test("detects '400' status code", () => {
      expect(deriveErrorCodeFromMessage("HTTP 400 Bad Request")).toBe(
        ACCOUNTING_ERROR_CODES.VALIDATION,
      );
    });
  });

  describe("NOT_FOUND detection", () => {
    test("detects 'not found' keyword", () => {
      expect(deriveErrorCodeFromMessage("Resource not found")).toBe(
        ACCOUNTING_ERROR_CODES.NOT_FOUND,
      );
    });

    test("detects '404' status code", () => {
      expect(deriveErrorCodeFromMessage("HTTP 404 response")).toBe(
        ACCOUNTING_ERROR_CODES.NOT_FOUND,
      );
    });
  });

  describe("SERVER_ERROR detection", () => {
    test("detects 500 status code", () => {
      expect(deriveErrorCodeFromMessage("HTTP 500 Internal Server Error")).toBe(
        ACCOUNTING_ERROR_CODES.SERVER_ERROR,
      );
    });

    test("detects 502 status code", () => {
      expect(deriveErrorCodeFromMessage("502 Bad Gateway")).toBe(
        ACCOUNTING_ERROR_CODES.SERVER_ERROR,
      );
    });

    test("detects 503 status code", () => {
      expect(deriveErrorCodeFromMessage("Service unavailable (503)")).toBe(
        ACCOUNTING_ERROR_CODES.SERVER_ERROR,
      );
    });
  });

  describe("UNKNOWN fallback", () => {
    test("returns UNKNOWN for unrecognized errors", () => {
      expect(deriveErrorCodeFromMessage("Something went wrong")).toBe(
        ACCOUNTING_ERROR_CODES.UNKNOWN,
      );
    });

    test("returns UNKNOWN for generic error", () => {
      expect(deriveErrorCodeFromMessage("An error occurred")).toBe(
        ACCOUNTING_ERROR_CODES.UNKNOWN,
      );
    });
  });

  describe("priority order", () => {
    test("INVALID_ACCOUNT takes precedence over NOT_FOUND for account errors", () => {
      // "Account not found" contains both "account" + "not found" and "not found"
      // Should match INVALID_ACCOUNT first
      expect(deriveErrorCodeFromMessage("Account not found in system")).toBe(
        ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
      );
    });
  });
});
