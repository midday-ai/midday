import type { useI18n } from "@/locales/client";
import { formatAmount } from "@midday/utils/format";
import { format } from "date-fns";

type UseI18nReturn = ReturnType<typeof useI18n>;

interface NotificationUser {
  locale?: string | null;
  dateFormat?: string | null;
}

interface NotificationMetadata {
  [key: string]: any;
}

type NotificationDescriptionHandler = (
  metadata: NotificationMetadata,
  user: NotificationUser | undefined,
  t: UseI18nReturn,
) => string;

const handleTransactionsCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const count = metadata?.count || metadata?.transactionCount || 1;
  const transaction = metadata?.transaction;

  // For single transactions, show rich details
  if (count === 1 && transaction) {
    const formattedAmount =
      formatAmount({
        currency: transaction.currency,
        amount: transaction.amount,
        locale: user?.locale || "en-US",
      }) || `${transaction.amount} ${transaction.currency}`;

    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const formattedDate = format(new Date(transaction.date), userDateFormat);

    return t("notifications.transactions_created.single_transaction", {
      name: transaction.name,
      amount: formattedAmount,
      date: formattedDate,
    });
  }

  // For multiple transactions, use count-based messages
  if (count <= 5) {
    return t("notifications.transactions_created.title", { count });
  }
  return t("notifications.transactions_created.title_many", { count });
};

const handleInboxNew: NotificationDescriptionHandler = (metadata, user, t) => {
  const count = metadata?.totalCount || 1;
  const type = metadata?.type;
  const provider = metadata?.provider ?? "";

  switch (type) {
    case "email":
      return t("notifications.inbox_new.type.email", { count });
    case "sync":
      // @ts-expect-error
      return t("notifications.inbox_new.type.sync", { count, provider });
    case "slack":
      return t("notifications.inbox_new.type.slack", { count });
    case "upload":
      return t("notifications.inbox_new.type.upload", { count });
    default:
      return t("notifications.inbox_new.title", { count });
  }
};

const handleInvoicePaid: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;
  const source = metadata?.source;
  const paidAt = metadata?.paidAt;

  if (invoiceNumber && source === "manual" && paidAt) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const paidDate = new Date(paidAt);
    const formattedDate = format(paidDate, userDateFormat);

    if (customerName) {
      return t("notifications.invoice_paid.manual_with_date", {
        invoiceNumber,
        customerName,
        date: formattedDate,
      });
    }
    return t("notifications.invoice_paid.manual_with_date_no_customer", {
      invoiceNumber,
      date: formattedDate,
    });
  }

  if (invoiceNumber && source === "manual") {
    return customerName
      ? t("notifications.invoice_paid.manual", {
          invoiceNumber,
          customerName,
        })
      : t("notifications.invoice_paid.manual_no_customer", {
          invoiceNumber,
        });
  }

  return invoiceNumber
    ? t("notifications.invoice_paid.automatic", { invoiceNumber })
    : t("notifications.invoice_paid.title");
};

const handleInvoiceOverdue: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  return invoiceNumber
    ? t("notifications.invoice_overdue.with_number", { invoiceNumber })
    : t("notifications.invoice_overdue.title");
};

const handleInvoiceScheduled: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const scheduledAt = metadata?.scheduledAt;
  const customerName = metadata?.customerName;

  if (invoiceNumber && scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const formattedDate = format(scheduledDate, userDateFormat);
    const formattedTime = format(scheduledDate, "HH:mm");

    if (customerName) {
      return t("notifications.invoice_scheduled.with_customer", {
        invoiceNumber,
        customerName,
        date: formattedDate,
        time: formattedTime,
      });
    }
    return t("notifications.invoice_scheduled.without_customer", {
      invoiceNumber,
      date: formattedDate,
      time: formattedTime,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_scheduled.simple", { invoiceNumber });
  }
  return t("notifications.invoice_scheduled.title");
};

const handleInvoiceSent: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;
  if (invoiceNumber && customerName) {
    return t("notifications.invoice_sent.with_customer", {
      invoiceNumber,
      customerName,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_sent.without_customer", {
      invoiceNumber,
    });
  }
  return t("notifications.invoice_sent.title");
};

const handleInvoiceReminderSent: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;
  if (invoiceNumber && customerName) {
    return t("notifications.invoice_reminder_sent.with_customer", {
      customerName,
      invoiceNumber,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_reminder_sent.without_customer", {
      invoiceNumber,
    });
  }
  return t("notifications.invoice_reminder_sent.title");
};

const handleInvoiceCancelled: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;

  if (invoiceNumber && customerName) {
    return t("notifications.invoice_cancelled.with_customer", {
      invoiceNumber,
      customerName,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_cancelled.without_customer", {
      invoiceNumber,
    });
  }
  return t("notifications.invoice_cancelled.title");
};

const handleInvoiceCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;
  const amount = metadata?.amount;
  const currency = metadata?.currency;

  if (invoiceNumber && customerName && amount && currency) {
    const formattedAmount =
      formatAmount({
        currency: currency,
        amount: amount,
        locale: user?.locale || "en-US",
      }) ||
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    return t("notifications.invoice_created.with_customer_and_amount", {
      invoiceNumber,
      customerName,
      amount: formattedAmount,
    });
  }
  if (invoiceNumber && customerName) {
    return t("notifications.invoice_created.with_customer", {
      invoiceNumber,
      customerName,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_created.without_customer", {
      invoiceNumber,
    });
  }
  return t("notifications.invoice_created.title");
};

const handleInvoiceRefunded: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const invoiceNumber = metadata?.invoiceNumber;
  const customerName = metadata?.customerName;

  if (invoiceNumber && customerName) {
    return t("notifications.invoice_refunded.with_customer", {
      invoiceNumber,
      customerName,
    });
  }
  if (invoiceNumber) {
    return t("notifications.invoice_refunded.without_customer", {
      invoiceNumber,
    });
  }
  return t("notifications.invoice_refunded.title");
};

const handleInboxAutoMatched: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const documentName = metadata?.documentName;
  const transactionName = metadata?.transactionName;
  const documentAmount = metadata?.documentAmount;
  const documentCurrency = metadata?.documentCurrency;
  const transactionAmount = metadata?.transactionAmount;
  const transactionCurrency = metadata?.transactionCurrency;
  const amount = metadata?.amount; // Fallback
  const currency = metadata?.currency; // Fallback

  // Handle cross-currency auto-matches with both amounts
  if (
    documentName &&
    transactionName &&
    documentAmount &&
    documentCurrency &&
    transactionAmount &&
    transactionCurrency &&
    documentCurrency !== transactionCurrency
  ) {
    const formattedDocAmount =
      formatAmount({
        currency: documentCurrency,
        amount: documentAmount,
        locale: user?.locale || "en-US",
      }) || `${documentAmount} ${documentCurrency}`;

    const formattedTransAmount =
      formatAmount({
        currency: transactionCurrency,
        amount: transactionAmount,
        locale: user?.locale || "en-US",
      }) || `${transactionAmount} ${transactionCurrency}`;

    return t("notifications.inbox_auto_matched.cross_currency_details", {
      documentName,
      transactionName,
      documentAmount: formattedDocAmount,
      transactionAmount: formattedTransAmount,
    });
  }

  // Handle same-currency or fallback to original logic
  if (
    documentName &&
    transactionName &&
    (documentAmount || amount) &&
    (documentCurrency || currency)
  ) {
    const finalAmount = documentAmount || amount;
    const finalCurrency = documentCurrency || currency;

    const formattedAmount =
      formatAmount({
        currency: finalCurrency,
        amount: finalAmount,
        locale: user?.locale || "en-US",
      }) ||
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: finalCurrency,
      }).format(finalAmount);

    return t("notifications.inbox_auto_matched.with_details", {
      documentName,
      transactionName,
      amount: formattedAmount,
    });
  }

  if (documentName && transactionName) {
    return t("notifications.inbox_auto_matched.with_names", {
      documentName,
      transactionName,
    });
  }

  return t("notifications.inbox_auto_matched.title");
};

const handleInboxNeedsReview: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const documentName = metadata?.documentName;
  const transactionName = metadata?.transactionName;
  const matchType = metadata?.matchType;
  const documentAmount = metadata?.documentAmount;
  const documentCurrency = metadata?.documentCurrency;
  const transactionAmount = metadata?.transactionAmount;
  const transactionCurrency = metadata?.transactionCurrency;

  // Handle cross-currency matches (both high confidence and suggested)
  if (
    documentName &&
    transactionName &&
    documentAmount &&
    documentCurrency &&
    transactionAmount &&
    transactionCurrency &&
    documentCurrency !== transactionCurrency
  ) {
    const formattedDocAmount =
      formatAmount({
        currency: documentCurrency,
        amount: documentAmount,
        locale: user?.locale || "en-US",
      }) || `${documentAmount} ${documentCurrency}`;

    const formattedTransAmount =
      formatAmount({
        currency: transactionCurrency,
        amount: transactionAmount,
        locale: user?.locale || "en-US",
      }) || `${transactionAmount} ${transactionCurrency}`;

    if (matchType === "high_confidence") {
      return t(
        "notifications.inbox_needs_review.cross_currency_high_confidence",
        {
          documentName,
          transactionName,
          documentAmount: formattedDocAmount,
          transactionAmount: formattedTransAmount,
        },
      );
    }
    return t("notifications.inbox_needs_review.cross_currency_suggested", {
      documentName,
      transactionName,
      documentAmount: formattedDocAmount,
      transactionAmount: formattedTransAmount,
    });
  }

  // Handle same-currency matches
  if (documentName && transactionName && documentAmount && documentCurrency) {
    const formattedAmount =
      formatAmount({
        currency: documentCurrency,
        amount: documentAmount,
        locale: user?.locale || "en-US",
      }) || `${documentAmount} ${documentCurrency}`;

    if (matchType === "high_confidence") {
      return t("notifications.inbox_needs_review.high_confidence_details", {
        documentName,
        transactionName,
        amount: formattedAmount,
      });
    }
    return t("notifications.inbox_needs_review.with_details", {
      documentName,
      transactionName,
      amount: formattedAmount,
    });
  }

  if (documentName && transactionName) {
    if (matchType === "high_confidence") {
      return t("notifications.inbox_needs_review.high_confidence_names", {
        documentName,
        transactionName,
      });
    }
    return t("notifications.inbox_needs_review.with_names", {
      documentName,
      transactionName,
    });
  }

  return t("notifications.inbox_needs_review.title");
};

const handleInboxCrossCurrencyMatched: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const documentName = metadata?.documentName;
  const transactionName = metadata?.transactionName;
  const documentAmount = metadata?.documentAmount;
  const documentCurrency = metadata?.documentCurrency;
  const transactionAmount = metadata?.transactionAmount;
  const transactionCurrency = metadata?.transactionCurrency;
  const matchType = metadata?.matchType;

  if (
    documentName &&
    transactionName &&
    documentAmount &&
    documentCurrency &&
    transactionAmount &&
    transactionCurrency
  ) {
    const formattedDocAmount =
      formatAmount({
        currency: documentCurrency,
        amount: documentAmount,
        locale: user?.locale || "en-US",
      }) ||
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: documentCurrency,
      }).format(documentAmount);

    const formattedTxAmount =
      formatAmount({
        currency: transactionCurrency,
        amount: transactionAmount,
        locale: user?.locale || "en-US",
      }) ||
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: transactionCurrency,
      }).format(transactionAmount);

    // Use different messaging based on match confidence
    if (matchType === "high_confidence") {
      return t(
        "notifications.inbox_cross_currency_matched.high_confidence_details",
        {
          documentName,
          transactionName,
          documentAmount: formattedDocAmount,
          transactionAmount: formattedTxAmount,
        },
      );
    }
    return t("notifications.inbox_cross_currency_matched.with_details", {
      documentName,
      transactionName,
      documentAmount: formattedDocAmount,
      transactionAmount: formattedTxAmount,
    });
  }

  if (documentName && transactionName) {
    if (matchType === "high_confidence") {
      return t(
        "notifications.inbox_cross_currency_matched.high_confidence_names",
        {
          documentName,
          transactionName,
        },
      );
    }
    return t("notifications.inbox_cross_currency_matched.with_names", {
      documentName,
      transactionName,
    });
  }

  return t("notifications.inbox_cross_currency_matched.title");
};

const notificationHandlers: Record<string, NotificationDescriptionHandler> = {
  transactions_created: handleTransactionsCreated,
  inbox_new: handleInboxNew,
  inbox_auto_matched: handleInboxAutoMatched,
  inbox_needs_review: handleInboxNeedsReview,
  inbox_cross_currency_matched: handleInboxCrossCurrencyMatched,
  invoice_paid: handleInvoicePaid,
  invoice_overdue: handleInvoiceOverdue,
  invoice_scheduled: handleInvoiceScheduled,
  invoice_sent: handleInvoiceSent,
  invoice_reminder_sent: handleInvoiceReminderSent,
  invoice_cancelled: handleInvoiceCancelled,
  invoice_created: handleInvoiceCreated,
  invoice_refunded: handleInvoiceRefunded,
};

export function getNotificationDescription(
  activityType: string,
  metadata: NotificationMetadata,
  user: NotificationUser | undefined,
  t: UseI18nReturn,
): string {
  const handler = notificationHandlers[activityType];
  if (handler) {
    return handler(metadata, user, t);
  }
  return t("notifications.default.title");
}
