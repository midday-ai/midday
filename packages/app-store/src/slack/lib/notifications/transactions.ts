import { createClient } from "@midday/supabase/server";
import { z } from "zod";
import config from "../../config";
import { createSlackWebClient } from "../client";

const transactionSchema = z.object({
  date: z.coerce.date(),
  amount: z.string(),
  name: z.string(),
});

export async function sendSlackTransactionsNotification({
  teamId,
  transactions,
}: {
  teamId: string;
  transactions: z.infer<typeof transactionSchema>[];
}) {
  const supabase = createClient({ admin: true });

  const { data } = await supabase
    .from("apps")
    .select("settings, config")
    .eq("team_id", teamId)
    .eq("app_id", config.id)
    .single();

  const enabled = data?.settings?.find(
    (setting: { id: string; value: boolean }) => setting.id === "transactions",
  )?.value;

  if (!enabled || !data?.config?.access_token) {
    return;
  }

  const client = createSlackWebClient({
    token: data.config.access_token,
  });

  try {
    await client.chat.postMessage({
      channel: data.config.channel_id,

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
    console.error(error);
  }
}
