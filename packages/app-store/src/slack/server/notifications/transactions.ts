import type { Database } from "@midday/db/client";
import { getAppByAppId } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { z } from "zod";
import { createSlackWebClient, ensureBotInChannel } from "../client";

const transactionSchema = z.object({
  amount: z.string(),
  name: z.string(),
});

export async function sendSlackTransactionNotifications({
  teamId,
  transactions,
  db,
}: {
  teamId: string;
  transactions: z.infer<typeof transactionSchema>[];
  db: Database;
}) {
  const data = await getAppByAppId(db, { teamId, appId: "slack" });

  const settings = z.array(z.unknown()).safeParse(data?.settings);
  const enabled =
    settings.success &&
    settings.data.some(
      (setting) =>
        z
          .object({ id: z.literal("transactions"), value: z.literal(true) })
          .safeParse(setting).success,
    );

  if (!enabled || !data?.config?.access_token) {
    return;
  }

  const client = createSlackWebClient({
    token: data.config.access_token,
  });

  try {
    // Ensure bot is in channel before sending message (auto-joins public channels)
    await ensureBotInChannel({ client, channelId: data.config.channel_id });

    await client.chat.postMessage({
      channel: data.config.channel_id,
      text: `You got ${transactions.length} new transaction${transactions.length === 1 ? "" : "s"}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "You got some new transactions! We'll do our best to match these with receipts in your Inbox or you can simply upload them in your <slack://app?id=A07PN48FW3A|Midday Assistant>.",
          },
        },
        {
          type: "divider",
        },
        ...transactions.map((transaction) => ({
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: transaction.name,
            },
            {
              type: "mrkdwn",
              text: transaction.amount,
            },
          ],
        })),
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View transactions",
              },
              url: "https://app.midday.ai/transactions",
              action_id: "button_click",
            },
          ],
        },
      ],
    });
  } catch (error) {
    logger.error("Failed to send Slack transaction notifications", {
      error: error instanceof Error ? error.message : String(error),
      teamId,
      transactionCount: transactions.length,
    });
  }
}
