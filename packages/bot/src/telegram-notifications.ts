const TELEGRAM_API_URL =
  process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org";

function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error(
      "Missing Telegram configuration: TELEGRAM_BOT_TOKEN is required",
    );
  }

  return { botToken };
}

export async function sendTelegramTextNotification(params: {
  chatId: string;
  text: string;
}) {
  const { botToken } = getTelegramConfig();

  const response = await fetch(
    `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        disable_web_page_preview: true,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${response.status} - ${error}`);
  }
}
