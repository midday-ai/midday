const TELEGRAM_API_URL = "https://api.telegram.org";

export type TelegramClientConfig = {
  botToken: string;
};

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export type SendMessageOptions = {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
  disable_notification?: boolean;
};

export type TelegramFile = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  caption?: string;
};

export type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TelegramDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  chat_instance: string;
  data?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

export class TelegramClient {
  private botToken: string;

  constructor(config: TelegramClientConfig) {
    this.botToken = config.botToken;
  }

  private get baseUrl(): string {
    return `${TELEGRAM_API_URL}/bot${this.botToken}`;
  }

  private async request<T>(method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as { ok: boolean; result: T; description?: string };

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || "Unknown error"}`);
    }

    return data.result;
  }

  /**
   * Send a text message
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<TelegramMessage> {
    return this.request<TelegramMessage>("sendMessage", {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  /**
   * Send a message with inline keyboard buttons
   */
  async sendMessageWithButtons(
    chatId: number | string,
    text: string,
    buttons: Array<{ text: string; callbackData: string }>,
    options?: Omit<SendMessageOptions, "reply_markup">,
  ): Promise<TelegramMessage> {
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          callback_data: btn.callbackData,
        })),
      ],
    };

    return this.sendMessage(chatId, text, {
      ...options,
      reply_markup: inlineKeyboard,
    });
  }

  /**
   * Answer a callback query (button press)
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert?: boolean,
  ): Promise<boolean> {
    return this.request<boolean>("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  }

  /**
   * Edit message text (for updating after button press)
   */
  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    options?: SendMessageOptions,
  ): Promise<TelegramMessage | boolean> {
    return this.request<TelegramMessage | boolean>("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }

  /**
   * Get file information by file_id
   */
  async getFile(fileId: string): Promise<TelegramFile> {
    return this.request<TelegramFile>("getFile", {
      file_id: fileId,
    });
  }

  /**
   * Download a file from Telegram servers
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    const response = await fetch(
      `${TELEGRAM_API_URL}/file/bot${this.botToken}/${filePath}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get file and download it in one step
   */
  async getFileAndDownload(fileId: string): Promise<{ buffer: Buffer; filePath: string }> {
    const file = await this.getFile(fileId);
    
    if (!file.file_path) {
      throw new Error("File path not available");
    }

    const buffer = await this.downloadFile(file.file_path);
    return { buffer, filePath: file.file_path };
  }

  /**
   * Set webhook URL for receiving updates
   */
  async setWebhook(
    url: string,
    options?: {
      secret_token?: string;
      max_connections?: number;
      allowed_updates?: string[];
    },
  ): Promise<boolean> {
    return this.request<boolean>("setWebhook", {
      url,
      ...options,
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(dropPendingUpdates?: boolean): Promise<boolean> {
    return this.request<boolean>("deleteWebhook", {
      drop_pending_updates: dropPendingUpdates,
    });
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo(): Promise<{
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
  }> {
    return this.request("getWebhookInfo");
  }

  /**
   * Get bot information
   */
  async getMe(): Promise<TelegramUser> {
    return this.request<TelegramUser>("getMe");
  }
}

/**
 * Create a Telegram client using environment variables
 */
export function createTelegramClient(): TelegramClient {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error(
      "Missing Telegram configuration: TELEGRAM_BOT_TOKEN is required",
    );
  }

  return new TelegramClient({ botToken });
}

// Emoji constants for reactions/status
export const TELEGRAM_EMOJIS = {
  PROCESSING: "⏳",
  SUCCESS: "✅",
  ERROR: "❌",
  RECEIPT: "🧾",
  MATCH: "🔗",
} as const;

