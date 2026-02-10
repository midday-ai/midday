import { createHmac, timingSafeEqual } from "node:crypto";

export async function verifySlackWebhook(req: Request) {
  const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

  if (!SLACK_SIGNING_SECRET) {
    throw new Error("SLACK_SIGNING_SECRET is not set");
  }

  const fiveMinutesInSeconds = 5 * 60;
  const slackSignatureVersion = "v0";

  const body = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const slackSignature = req.headers.get("x-slack-signature");

  if (!timestamp || !slackSignature) {
    throw new Error("Missing required Slack headers");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (
    Math.abs(currentTime - Number.parseInt(timestamp, 10)) >
    fiveMinutesInSeconds
  ) {
    throw new Error("Request is too old");
  }

  const sigBasestring = `${slackSignatureVersion}:${timestamp}:${body}`;
  const mySignature = createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest("hex");

  const expectedSignature = `${slackSignatureVersion}=${mySignature}`;
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(slackSignature);

  // timingSafeEqual requires buffers of equal length
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error("Invalid Slack signature");
  }

  return JSON.parse(body);
}
