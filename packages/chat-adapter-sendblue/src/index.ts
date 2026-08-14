import type { Logger } from "chat";
import { SendblueAdapter } from "./adapter";
import type {
  SendblueAdapterConfig,
  SendblueCredentialProvider,
  SendblueCredentials,
} from "./types";

export { SendblueAdapter } from "./adapter";
export { toPlainText } from "./format-converter";
export type {
  SendblueAdapterConfig,
  SendblueCredentialProvider,
  SendblueCredentials,
  SendblueMessagePayload,
  SendblueReaction,
  SendblueService,
  SendblueThreadId,
  SendblueTypingPayload,
} from "./types";
export { REACTION_ALIASES, VALID_REACTIONS } from "./types";

export function createSendblueAdapter(
  config?: Partial<SendblueAdapterConfig> & { logger?: Logger },
): SendblueAdapter {
  const credentials = config?.credentials ?? environmentCredentials(config);
  return new SendblueAdapter({
    ...config,
    credentials,
    webhookSecret: config?.webhookSecret ?? process.env.SENDBLUE_WEBHOOK_SECRET,
    statusCallbackUrl:
      config?.statusCallbackUrl ?? process.env.SENDBLUE_STATUS_CALLBACK_URL,
  });
}

/**
 * Builds a lazy credential provider from static config or the standard
 * environment variables. Kept separate so Connect helpers can supply their
 * own provider without evaluating any secret during module initialization.
 */
function environmentCredentials(
  config?: Partial<SendblueAdapterConfig>,
): SendblueCredentialProvider {
  return (): SendblueCredentials => {
    const apiKey = config?.apiKey ?? process.env.SENDBLUE_API_KEY;
    const apiSecret = config?.apiSecret ?? process.env.SENDBLUE_API_SECRET;
    const defaultFromNumber =
      config?.defaultFromNumber ?? process.env.SENDBLUE_FROM_NUMBER;
    if (!apiKey) {
      throw new Error(
        "Sendblue API key is required. Pass it in config or set SENDBLUE_API_KEY.",
      );
    }
    if (!apiSecret) {
      throw new Error(
        "Sendblue API secret is required. Pass it in config or set SENDBLUE_API_SECRET.",
      );
    }
    if (!defaultFromNumber) {
      throw new Error(
        "Sendblue from_number is required. Pass it in config or set SENDBLUE_FROM_NUMBER.",
      );
    }
    return { apiKey, apiSecret, defaultFromNumber };
  };
}
