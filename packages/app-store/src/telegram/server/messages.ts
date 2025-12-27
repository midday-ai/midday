/**
 * Message builder utility for consistent Telegram message formatting
 * Provides structured message templates
 */

export class MessageBuilder {
  private parts: string[] = [];

  /**
   * Add a header section
   */
  header(text: string): this {
    this.parts.push(`*${text}*`);
    return this;
  }

  /**
   * Add a section title
   */
  section(title: string): this {
    if (this.parts.length > 0) {
      this.parts.push("");
    }
    this.parts.push(`*${title}*`);
    return this;
  }

  /**
   * Add a line of text
   */
  line(text: string): this {
    this.parts.push(text);
    return this;
  }

  /**
   * Add a bullet point
   */
  bullet(text: string): this {
    this.parts.push(`• ${text}`);
    return this;
  }

  /**
   * Add multiple bullet points
   */
  bullets(items: string[]): this {
    for (const item of items) {
      this.bullet(item);
    }
    return this;
  }

  /**
   * Add a key-value pair
   */
  keyValue(key: string, value: string): this {
    this.parts.push(`*${key}:* ${value}`);
    return this;
  }

  /**
   * Add empty line for spacing
   */
  blank(): this {
    this.parts.push("");
    return this;
  }

  /**
   * Build the final message string
   */
  build(): string {
    return this.parts.join("\n");
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.parts = [];
    return this;
  }
}

/**
 * Format a connection success message
 */
export function formatConnectionSuccess(teamName: string): {
  text: string;
  buttons?: Array<{ text: string; callbackData: string }>;
} {
  const builder = new MessageBuilder();
  builder
    .header("✅ Connected Successfully")
    .blank()
    .line("You're now connected to:")
    .line(`*${teamName}*`)
    .blank()
    .section("What you can do:")
    .bullet("Send receipts & invoices")
    .bullet("Auto-extract data")
    .bullet("Match to transactions");

  return {
    text: builder.build(),
    buttons: [{ text: "Open Midday", callbackData: "open_midday" }],
  };
}

/**
 * Format a welcome message for unconnected users
 */
export function formatWelcomeMessage(): {
  text: string;
} {
  const builder = new MessageBuilder();
  builder
    .header("👋 Welcome to Midday")
    .blank()
    .line("To connect your Telegram:")
    .bullet("Go to Apps in your Midday dashboard")
    .bullet("Click Connect on Telegram")
    .bullet("Send the code shown here")
    .blank()
    .line("Or send your inbox ID to get started.");

  return {
    text: builder.build(),
  };
}

/**
 * Format an already connected message
 */
export function formatAlreadyConnectedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("✅ Already Connected")
    .blank()
    .line("You're already connected to Midday.")
    .blank()
    .line("Simply send photos or PDFs of receipts and invoices here,")
    .line("and I'll automatically extract the data and match them")
    .line("to your transactions.");

  return builder.build();
}

/**
 * Format an error message for already connected to another team
 */
export function formatAlreadyConnectedToAnotherTeamError(
  currentTeamName: string,
  requestedTeamName: string,
): string {
  const builder = new MessageBuilder();
  builder
    .header("⚠️ Already Connected")
    .blank()
    .line("This Telegram account is already connected to:")
    .line(`*${currentTeamName}*`)
    .blank()
    .line(`To connect to ${requestedTeamName}, please disconnect`)
    .line("from the current team first in your Midday dashboard.");

  return builder.build();
}

/**
 * Format a team not found error message
 */
export function formatTeamNotFoundError(): string {
  const builder = new MessageBuilder();
  builder
    .header("❌ Team Not Found")
    .blank()
    .line("We couldn't find a team with that inbox ID.")
    .blank()
    .line("Please check the ID and try again.");

  return builder.build();
}

/**
 * Format a document processing success message
 */
export function formatDocumentProcessedSuccess(params: {
  documentType: "Receipt" | "Invoice";
  vendor?: string;
  date?: string;
  amount?: string;
  currency?: string;
  invoiceNumber?: string;
  taxAmount?: string;
  taxType?: string;
}): {
  text: string;
  buttons?: Array<{ text: string; callbackData: string }>;
} {
  const builder = new MessageBuilder();
  builder.header(`🧾 ${params.documentType} Processed`).blank();

  if (params.vendor) {
    builder.keyValue("Vendor", params.vendor);
  }

  if (params.date) {
    builder.keyValue("Date", params.date);
  }

  if (params.invoiceNumber) {
    builder.keyValue("Invoice #", params.invoiceNumber);
  }

  if (params.amount) {
    const amountDisplay = params.currency
      ? `${params.amount} ${params.currency}`
      : params.amount;
    builder.keyValue("Amount", amountDisplay);
  }

  if (params.taxAmount && params.taxType) {
    const taxLabel = params.taxType.toUpperCase();
    const taxDisplay = params.currency
      ? `${params.taxAmount} ${params.currency}`
      : params.taxAmount;
    builder.keyValue(taxLabel, taxDisplay);
  }

  return {
    text: builder.build(),
    buttons: [{ text: "View in Midday", callbackData: "view_inbox" }],
  };
}

/**
 * Format a document extraction failed message
 */
export function formatExtractionFailedMessage(): {
  text: string;
  buttons?: Array<{ text: string; callbackData: string }>;
} {
  const builder = new MessageBuilder();
  builder
    .header("⚠️ Extraction Failed")
    .blank()
    .line("We couldn't automatically extract data from this document.")
    .line("It has been added to your inbox for manual review.");

  return {
    text: builder.build(),
    buttons: [{ text: "Review Manually", callbackData: "view_inbox" }],
  };
}

/**
 * Format a processing error message
 */
export function formatProcessingErrorMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("❌ Processing Error")
    .blank()
    .line("Sorry, we encountered an error processing your document.")
    .blank()
    .line("Please try again or upload it directly in Midday.");

  return builder.build();
}

/**
 * Format an unsupported file type error message
 */
export function formatUnsupportedFileTypeMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("❌ Unsupported File Type")
    .blank()
    .line("Sorry, this file type is not supported.")
    .blank()
    .section("Supported formats:")
    .bullet("JPEG, PNG, WebP (images)")
    .bullet("PDF (documents)");

  return builder.build();
}

/**
 * Format a not connected error message
 */
export function formatNotConnectedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("❌ Not Connected")
    .blank()
    .line("Your Telegram is not connected to Midday yet.")
    .blank()
    .line("Please go to Apps in your Midday dashboard and connect Telegram.");

  return builder.build();
}

/**
 * Format a match notification message
 */
export function formatMatchNotification(params: {
  receiptName: string;
  transactionName: string;
  amount: string;
  currency: string;
  transactionDate?: string;
}): {
  text: string;
  buttons: Array<{ text: string; callbackData: string }>;
} {
  const builder = new MessageBuilder();
  builder.header("🔗 Match Found").blank();

  builder.keyValue("Receipt", params.receiptName);
  builder.keyValue("Transaction", params.transactionName);
  builder.keyValue("Amount", `${params.amount} ${params.currency}`);

  if (params.transactionDate) {
    builder.keyValue("Date", params.transactionDate);
  }

  return {
    text: builder.build(),
    buttons: [
      { text: "✅ Confirm", callbackData: "confirm_match" },
      { text: "❌ Decline", callbackData: "decline_match" },
    ],
  };
}

/**
 * Format a match confirmed message
 */
export function formatMatchConfirmedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("✅ Match Confirmed")
    .blank()
    .line("The receipt has been linked to the transaction.");

  return builder.build();
}

/**
 * Format a match declined message
 */
export function formatMatchDeclinedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("↩️ Match Declined")
    .blank()
    .line("You can review and match this receipt manually in Midday.");

  return builder.build();
}

/**
 * Format processing started message
 */
export function formatProcessingStartedMessage(): string {
  return "⏳ Processing your document...";
}

/**
 * Format invalid code message
 */
export function formatInvalidCodeMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("❌ Invalid Code")
    .blank()
    .line("The code you entered is invalid or has expired.")
    .blank()
    .line("Please get a new code from your Midday dashboard.");

  return builder.build();
}
