import SendblueAPI from "sendblue";

function getSendblueConfig() {
  const apiKey = process.env.SENDBLUE_API_KEY;
  const apiSecret = process.env.SENDBLUE_API_SECRET;
  const fromNumber = process.env.SENDBLUE_FROM_NUMBER;

  if (!apiKey || !apiSecret || !fromNumber) {
    throw new Error(
      "Missing Sendblue configuration: SENDBLUE_API_KEY, SENDBLUE_API_SECRET, and SENDBLUE_FROM_NUMBER are required",
    );
  }

  return { apiKey, apiSecret, fromNumber };
}

export async function sendSendblueTextNotification(params: {
  phoneNumber: string;
  text: string;
}) {
  const { apiKey, apiSecret, fromNumber } = getSendblueConfig();

  const client = new SendblueAPI({ apiKey, apiSecret });

  await client.messages.send({
    content: params.text,
    from_number: fromNumber,
    number: params.phoneNumber,
    status_callback: process.env.SENDBLUE_STATUS_CALLBACK_URL,
  });
}
