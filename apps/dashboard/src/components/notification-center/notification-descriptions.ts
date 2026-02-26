import type { useI18n } from "@/locales/client";
import { getFrequencyShortLabel } from "@midday/deal/recurring";
import { formatAmount } from "@midday/utils/format";
import { format, parseISO } from "date-fns";

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
    const formattedDate = format(parseISO(transaction.date), userDateFormat);

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
    case "upload":
      return t("notifications.inbox_new.type.upload", { count });
    default:
      return t("notifications.inbox_new.title", { count });
  }
};

const handleDealPaid: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;
  const source = metadata?.source;
  const paidAt = metadata?.paidAt;

  if (dealNumber && source === "manual" && paidAt) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const paidDate = new Date(paidAt);
    const formattedDate = format(paidDate, userDateFormat);

    if (merchantName) {
      return t("notifications.deal_paid.manual_with_date", {
        dealNumber,
        merchantName,
        date: formattedDate,
      });
    }
    return t("notifications.deal_paid.manual_with_date_no_merchant", {
      dealNumber,
      date: formattedDate,
    });
  }

  if (dealNumber && source === "manual") {
    return merchantName
      ? t("notifications.deal_paid.manual", {
          dealNumber,
          merchantName,
        })
      : t("notifications.deal_paid.manual_no_merchant", {
          dealNumber,
        });
  }

  return dealNumber
    ? t("notifications.deal_paid.automatic", { dealNumber })
    : t("notifications.deal_paid.title");
};

const handleDealOverdue: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  return dealNumber
    ? t("notifications.deal_overdue.with_number", { dealNumber })
    : t("notifications.deal_overdue.title");
};

const handleDealScheduled: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const scheduledAt = metadata?.scheduledAt;
  const merchantName = metadata?.merchantName;

  if (dealNumber && scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const formattedDate = format(scheduledDate, userDateFormat);
    const formattedTime = format(scheduledDate, "HH:mm");

    if (merchantName) {
      return t("notifications.deal_scheduled.with_merchant", {
        dealNumber,
        merchantName,
        date: formattedDate,
        time: formattedTime,
      });
    }
    return t("notifications.deal_scheduled.without_merchant", {
      dealNumber,
      date: formattedDate,
      time: formattedTime,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_scheduled.simple", { dealNumber });
  }
  return t("notifications.deal_scheduled.title");
};

const handleDealSent: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;
  if (dealNumber && merchantName) {
    return t("notifications.deal_sent.with_merchant", {
      dealNumber,
      merchantName,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_sent.without_merchant", {
      dealNumber,
    });
  }
  return t("notifications.deal_sent.title");
};

const handleDealReminderSent: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;
  if (dealNumber && merchantName) {
    return t("notifications.deal_reminder_sent.with_merchant", {
      merchantName,
      dealNumber,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_reminder_sent.without_merchant", {
      dealNumber,
    });
  }
  return t("notifications.deal_reminder_sent.title");
};

const handleDealCancelled: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;

  if (dealNumber && merchantName) {
    return t("notifications.deal_cancelled.with_merchant", {
      dealNumber,
      merchantName,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_cancelled.without_merchant", {
      dealNumber,
    });
  }
  return t("notifications.deal_cancelled.title");
};

const handleDealCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;
  const amount = metadata?.amount;
  const currency = metadata?.currency;

  if (dealNumber && merchantName && amount && currency) {
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
    return t("notifications.deal_created.with_merchant_and_amount", {
      dealNumber,
      merchantName,
      amount: formattedAmount,
    });
  }
  if (dealNumber && merchantName) {
    return t("notifications.deal_created.with_merchant", {
      dealNumber,
      merchantName,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_created.without_merchant", {
      dealNumber,
    });
  }
  return t("notifications.deal_created.title");
};

const handleDealRefunded: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const dealNumber = metadata?.dealNumber;
  const merchantName = metadata?.merchantName;

  if (dealNumber && merchantName) {
    return t("notifications.deal_refunded.with_merchant", {
      dealNumber,
      merchantName,
    });
  }
  if (dealNumber) {
    return t("notifications.deal_refunded.without_merchant", {
      dealNumber,
    });
  }
  return t("notifications.deal_refunded.title");
};

const handleRecurringSeriesStarted: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const merchantName = metadata?.merchantName;
  const rawFrequency = metadata?.frequency;
  const endType = metadata?.endType;
  const endCount = metadata?.endCount;

  // Convert raw frequency (e.g., "monthly_date") to human-readable label (e.g., "Monthly")
  const frequency = rawFrequency
    ? getFrequencyShortLabel(rawFrequency)
    : undefined;

  if (merchantName && frequency) {
    if (endType === "after_count" && endCount) {
      return t(
        "notifications.recurring_series_started.with_merchant_and_count",
        {
          merchantName,
          frequency,
          count: endCount,
        },
      );
    }
    return t("notifications.recurring_series_started.with_merchant", {
      merchantName,
      frequency,
    });
  }
  if (frequency) {
    return t("notifications.recurring_series_started.with_frequency", {
      frequency,
    });
  }
  return t("notifications.recurring_series_started.title");
};

const handleRecurringSeriesCompleted: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const merchantName = metadata?.merchantName;
  const totalGenerated = metadata?.totalGenerated;

  if (merchantName && totalGenerated) {
    return t(
      "notifications.recurring_series_completed.with_merchant_and_count",
      {
        merchantName,
        count: totalGenerated,
      },
    );
  }
  if (totalGenerated) {
    return t("notifications.recurring_series_completed.with_count", {
      count: totalGenerated,
    });
  }
  return t("notifications.recurring_series_completed.title");
};

const handleRecurringSeriesPaused: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const merchantName = metadata?.merchantName;
  const reason = metadata?.reason;
  const failureCount = metadata?.failureCount;

  if (reason === "auto_failure" && failureCount) {
    if (merchantName) {
      return t(
        "notifications.recurring_series_paused.auto_failure_with_merchant",
        {
          merchantName,
          failureCount,
        },
      );
    }
    return t("notifications.recurring_series_paused.auto_failure", {
      failureCount,
    });
  }
  if (merchantName) {
    return t("notifications.recurring_series_paused.with_merchant", {
      merchantName,
    });
  }
  return t("notifications.recurring_series_paused.title");
};

const handleRecurringDealUpcoming: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const count = metadata?.count ?? 1;
  const deals = metadata?.deals as
    | Array<{
        merchantName?: string;
        amount?: number;
        currency?: string;
      }>
    | undefined;

  // Single deal with details
  if (count === 1 && deals?.[0]) {
    const deal = deals[0];
    if (deal.merchantName && deal.amount && deal.currency) {
      const formattedAmount =
        formatAmount({
          currency: deal.currency,
          amount: deal.amount,
          locale: user?.locale || "en-US",
        }) ||
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: deal.currency,
        }).format(deal.amount);

      return t("notifications.recurring_deal_upcoming.single_with_details", {
        merchantName: deal.merchantName,
        amount: formattedAmount,
      });
    }
    if (deal.merchantName) {
      return t(
        "notifications.recurring_deal_upcoming.single_with_merchant",
        {
          merchantName: deal.merchantName,
        },
      );
    }
  }

  // Multiple deals or single without details
  return t("notifications.recurring_deal_upcoming.batch", { count });
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
  deal_paid: handleDealPaid,
  deal_overdue: handleDealOverdue,
  deal_scheduled: handleDealScheduled,
  deal_sent: handleDealSent,
  deal_reminder_sent: handleDealReminderSent,
  deal_cancelled: handleDealCancelled,
  deal_created: handleDealCreated,
  deal_refunded: handleDealRefunded,
  recurring_series_started: handleRecurringSeriesStarted,
  recurring_series_completed: handleRecurringSeriesCompleted,
  recurring_series_paused: handleRecurringSeriesPaused,
  recurring_deal_upcoming: handleRecurringDealUpcoming,
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
