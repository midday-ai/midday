const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

export type WhatsAppClientConfig = {
  phoneNumberId: string;
  accessToken: string;
};

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;

  constructor(config: WhatsAppClientConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
  }

  private async request(endpoint: string, body: unknown) {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${this.phoneNumberId}${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Send a text message
   */
  async sendMessage(to: string, text: string) {
    return this.request("/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    });
  }

  /**
   * React to a message with an emoji
   */
  async reactToMessage(to: string, messageId: string, emoji: string) {
    return this.request("/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "reaction",
      reaction: {
        message_id: messageId,
        emoji,
      },
    });
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(to: string, messageId: string) {
    return this.request("/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "reaction",
      reaction: {
        message_id: messageId,
        emoji: "", // Empty emoji removes the reaction
      },
    });
  }

  /**
   * Send interactive buttons (for match suggestions)
   */
  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
  ) {
    return this.request("/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    });
  }

  /**
   * Send a list message (for multi-option scenarios)
   * @param to - Recipient phone number
   * @param body - Message body text
   * @param buttonText - Text for the button that opens the list (max 20 chars)
   * @param sections - Array of sections, each containing rows
   */
  async sendListMessage(
    to: string,
    body: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
  ) {
    // WhatsApp limits: max 10 sections, max 10 rows per section
    if (sections.length > 10) {
      throw new Error("Maximum 10 sections allowed in list message");
    }

    for (const section of sections) {
      if (section.rows.length > 10) {
        throw new Error("Maximum 10 rows allowed per section");
      }
    }

    return this.request("/messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: body },
        action: {
          button: buttonText,
          sections: sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description,
            })),
          })),
        },
      },
    });
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get media URL: ${response.status}`);
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  /**
   * Download media from Meta servers
   */
  async downloadMedia(mediaId: string): Promise<Buffer> {
    // First get the media URL
    const mediaUrl = await this.getMediaUrl(mediaId);

    // Then download the actual file
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Create a WhatsApp client using environment variables
 */
export function createWhatsAppClient(): WhatsAppClient {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "Missing WhatsApp configuration: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required",
    );
  }

  return new WhatsAppClient({ phoneNumberId, accessToken });
}

// Emoji constants for reactions
export const REACTION_EMOJIS = {
  PROCESSING: "\u23F3", // Hourglass
  SUCCESS: "\u2705", // White check mark
  ERROR: "\u274C", // Cross mark
} as const;
