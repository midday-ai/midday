import { logger } from "./logger";

/**
 * Extract useful error details from provider HTTP errors (xior/axios).
 * Includes status code and response body when available.
 */
export function getProviderErrorDetails(
  error: unknown,
): Record<string, unknown> {
  const details: Record<string, unknown> = {
    error: error instanceof Error ? error.message : String(error),
  };

  const e = error as {
    response?: { status?: number; data?: unknown };
  } | null;

  if (e?.response?.status) {
    details.status = e.response.status;
  }
  if (e?.response?.data) {
    details.providerError = e.response.data;
  }

  return details;
}

export class ProviderError extends Error {
  code: string;

  constructor({ message, code }: { message: string; code: string }) {
    super(message);
    this.code = this.setCode(code);
  }

  setCode(code: string) {
    // Teller
    if (this.message === "The requested account is closed") {
      return "disconnected";
    }

    // GoCardLess
    if (this.message.startsWith("EUA was valid for")) {
      return "disconnected";
    }

    switch (code) {
      // Teller
      case "enrollment.disconnected":
      case "enrollment.disconnected.user_action.mfa_required":
      case "enrollment.disconnected.account_locked":
      case "enrollment.disconnected.credentials_invalid":
      case "enrollment.disconnected.enrollment_inactive":
      case "enrollment.disconnected.user_action.contact_information_required":
      case "enrollment.disconnected.user_action.insufficient_permissions":
      case "enrollment.disconnected.user_action.captcha_required":
      case "enrollment.disconnected.user_action.web_login_required":
      // Plaid
      case "ITEM_LOGIN_REQUIRED":
      case "ITEM_LOCKED":
      case "ITEM_CONCURRENTLY_DELETED":
      case "ACCESS_NOT_GRANTED":
      // GoCardLess
      case "AccessExpiredError":
      case "AccountInactiveError":
      case "Account suspended":
        logger.warn("Provider disconnected", { code, message: this.message });
        return "disconnected";

      // EnableBanking
      case "ALREADY_AUTHORIZED":
        return "already_authorized";

      default:
        logger.warn("Unknown provider error", { code, message: this.message });
        return "unknown";
    }
  }
}

export function createErrorResponse(error: unknown) {
  logger.error("Provider error response", {
    error: error instanceof Error ? error.message : String(error),
  });

  if (error instanceof ProviderError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  return {
    message: String(error),
    code: "unknown",
  };
}
