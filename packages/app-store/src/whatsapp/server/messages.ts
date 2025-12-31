/**
 * Message builder utility for consistent WhatsApp message formatting
 * Provides structured message templates
 */

export class MessageBuilder {
  private parts: string[] = [];

  /**
   * Add a header section
   */
  header(text: string): this {
    this.parts.push(text);
    return this;
  }

  /**
   * Add a section title
   */
  section(title: string): this {
    if (this.parts.length > 0) {
      this.parts.push("");
    }
    this.parts.push(title);
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
    this.parts.push(`${key}: ${value}`);
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
   * Add a footer with closing border
   */
  footer(): this {
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
export function formatConnectionSuccess(teamName: string): string {
  const builder = new MessageBuilder();
  builder
    .header("Connected Successfully")
    .blank()
    .line("You're now connected to:")
    .line(teamName)
    .blank()
    .section("What you can do:")
    .bullet("Send receipts & invoices")
    .bullet("Auto-extract data")
    .bullet("Match to transactions")
    .blank()
    .footer();

  return builder.build();
}

/**
 * Format a welcome message for unconnected users
 */
export function formatWelcomeMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Welcome to Midday")
    .blank()
    .line("To connect your WhatsApp:")
    .bullet("Scan the QR code in your Midday dashboard")
    .bullet("Or send your inbox ID")
    .blank();

  return builder.build();
}

/**
 * Format an already connected message
 */
export function formatAlreadyConnectedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Already Connected")
    .blank()
    .line("You're already connected to Midday.")
    .blank()
    .line("Simply send photos or PDFs of receipts and invoices here,")
    .line("and I'll automatically extract the data and match them")
    .line("to your transactions.")
    .blank()
    .footer();

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
    .header("Already Connected")
    .blank()
    .line("This WhatsApp number is already connected to:")
    .line(currentTeamName)
    .blank()
    .line(`To connect to ${requestedTeamName}, please disconnect`)
    .line("from the current team first in your Midday dashboard.")
    .blank()
    .footer();

  return builder.build();
}

/**
 * Format a team not found error message
 */
export function formatTeamNotFoundError(): string {
  const builder = new MessageBuilder();
  builder
    .header("Team Not Found")
    .blank()
    .line("We couldn't find a team with that inbox ID.")
    .blank()
    .line("Please check the ID and try again.")
    .blank();

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
}): string {
  const builder = new MessageBuilder();
  builder.header(`${params.documentType} Processed`).blank();

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

  builder.footer();

  return builder.build();
}

/**
 * Format a document extraction failed message
 */
export function formatExtractionFailedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Extraction Failed")
    .blank()
    .line("We couldn't automatically extract data from this document.")
    .line("It has been added to your inbox for manual review.")
    .blank()
    .footer();

  return builder.build();
}

/**
 * Format a processing error message
 */
export function formatProcessingErrorMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Processing Error")
    .blank()
    .line("Sorry, we encountered an error processing your document.")
    .blank()
    .line("Please try again or upload it directly in Midday.")
    .blank();

  return builder.build();
}

/**
 * Format an unsupported file type error message
 */
export function formatUnsupportedFileTypeMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Unsupported File Type")
    .blank()
    .line("Sorry, this file type is not supported.")
    .blank()
    .section("Supported formats:")
    .bullet("JPEG, PNG, WebP, HEIC (images)")
    .bullet("PDF (documents)")
    .blank()
    .footer();

  return builder.build();
}

/**
 * Format a not connected error message
 */
export function formatNotConnectedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Not Connected")
    .blank()
    .line("Your WhatsApp is not connected to Midday yet.")
    .blank()
    .line("Please scan the QR code in your Midday dashboard to connect.")
    .blank();

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
}): string {
  const builder = new MessageBuilder();
  builder.header("Match Found").blank();

  builder.keyValue("Receipt", params.receiptName);
  builder.keyValue("Transaction", params.transactionName);
  builder.keyValue("Amount", `${params.amount} ${params.currency}`);

  if (params.transactionDate) {
    builder.keyValue("Date", params.transactionDate);
  }

  builder.blank().footer();

  return builder.build();
}

/**
 * Format a match confirmed message
 */
export function formatMatchConfirmedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Match Confirmed")
    .blank()
    .line("The receipt has been linked to the transaction.")
    .blank();

  return builder.build();
}

/**
 * Format a match declined message
 */
export function formatMatchDeclinedMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Match Declined")
    .blank()
    .line("You can review and match this receipt manually in Midday.")
    .blank()
    .footer();

  return builder.build();
}

/**
 * Format a match suggestion not found error
 */
export function formatMatchSuggestionNotFoundMessage(): string {
  const builder = new MessageBuilder();
  builder
    .header("Match Not Found")
    .blank()
    .line("We couldn't find this match suggestion.")
    .line("It may have already been processed or expired.")
    .blank();

  return builder.build();
}

/**
 * Format a match action error message
 */
export function formatMatchActionErrorMessage(
  action: "confirm" | "decline",
): string {
  const builder = new MessageBuilder();
  builder
    .header("Error")
    .blank()
    .line(
      `Sorry, we encountered an error processing your ${action === "confirm" ? "confirmation" : "decline"}.`,
    )
    .blank()
    .line("Please try again or handle this in Midday.")
    .blank()
    .footer();

  return builder.build();
}
