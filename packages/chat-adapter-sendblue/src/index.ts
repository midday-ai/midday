import type { Logger } from "chat";
import { SendblueAdapter } from "./adapter";
import type { SendblueAdapterConfig } from "./types";

export { SendblueAdapter } from "./adapter";
export { toPlainText } from "./format-converter";
export type {
  SendblueAdapterConfig,
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

  return new SendblueAdapter({
    apiKey,
    apiSecret,
    defaultFromNumber,
    webhookSecret: config?.webhookSecret ?? process.env.SENDBLUE_WEBHOOK_SECRET,
    webhookSecretHeader: config?.webhookSecretHeader,
    statusCallbackUrl:
      config?.statusCallbackUrl ?? process.env.SENDBLUE_STATUS_CALLBACK_URL,
    allowedServices: config?.allowedServices,
    logger: config?.logger,
  });
}
