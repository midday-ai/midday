#!/usr/bin/env bun
/**
 * Script to register Telegram Bot webhook
 *
 * Usage:
 *   bun run scripts/register-telegram-webhook.ts
 *
 * Environment variables required:
 *   TELEGRAM_BOT_TOKEN - Your Telegram Bot token from @BotFather
 *   TELEGRAM_WEBHOOK_SECRET - A secret string for webhook verification
 *   API_URL - Your API base URL (e.g., https://api.midday.ai)
 *
 * The webhook will be registered at: {API_URL}/webhooks/telegram
 */

import { createTelegramClient } from "@midday/app-store/telegram/server";

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const apiUrl = process.env.API_URL || "https://api.midday.ai";

  if (!botToken) {
    console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  if (!webhookSecret) {
    console.error(
      "Error: TELEGRAM_WEBHOOK_SECRET environment variable is required",
    );
    process.exit(1);
  }

  const webhookUrl = `${apiUrl}/webhooks/telegram`;

  console.log("Registering Telegram webhook...");
  console.log(`  Bot Token: ${botToken.slice(0, 10)}...`);
  console.log(`  Webhook URL: ${webhookUrl}`);

  try {
    const client = createTelegramClient();

    // First, get bot info to verify token is valid
    const botInfo = await client.getMe();
    console.log(`  Bot Username: @${botInfo.username}`);

    // Check current webhook status
    const currentWebhook = await client.getWebhookInfo();
    if (currentWebhook.url) {
      console.log(`  Current webhook: ${currentWebhook.url}`);
      if (currentWebhook.last_error_message) {
        console.log(
          `  Last error: ${currentWebhook.last_error_message} (${new Date((currentWebhook.last_error_date || 0) * 1000).toISOString()})`,
        );
      }
    }

    // Register the webhook
    const result = await client.setWebhook(webhookUrl, {
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"],
      max_connections: 40,
    });

    if (result) {
      console.log("\n✅ Webhook registered successfully!");
      console.log(`\nNext steps:`);
      console.log(
        `  1. Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${botInfo.username} in dashboard .env`,
      );
      console.log(
        `  2. Ensure TELEGRAM_WEBHOOK_SECRET is set in your API environment`,
      );
      console.log(
        `  3. Users can now connect by messaging @${botInfo.username}`,
      );
    } else {
      console.error("\n❌ Failed to register webhook");
      process.exit(1);
    }
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exit(1);
  }
}

// Check for --delete flag to remove webhook
if (process.argv.includes("--delete")) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("Deleting Telegram webhook...");

  const client = createTelegramClient();
  client
    .deleteWebhook(true)
    .then(() => {
      console.log("✅ Webhook deleted successfully!");
    })
    .catch((error) => {
      console.error(
        "❌ Error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    });
} else if (process.argv.includes("--status")) {
  // Check webhook status
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("Checking Telegram webhook status...");

  const client = createTelegramClient();
  Promise.all([client.getMe(), client.getWebhookInfo()])
    .then(([botInfo, webhookInfo]) => {
      console.log(`\nBot: @${botInfo.username} (${botInfo.first_name})`);
      console.log(`Webhook URL: ${webhookInfo.url || "(not set)"}`);
      console.log(`Pending updates: ${webhookInfo.pending_update_count}`);
      if (webhookInfo.last_error_message) {
        console.log(
          `Last error: ${webhookInfo.last_error_message} (${new Date((webhookInfo.last_error_date || 0) * 1000).toISOString()})`,
        );
      }
    })
    .catch((error) => {
      console.error(
        "❌ Error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    });
} else {
  main();
}

