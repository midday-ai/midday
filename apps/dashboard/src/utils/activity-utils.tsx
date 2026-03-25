import { Icons } from "@midday/ui/icons";

export function getActivityIcon(activityType: string, className = "size-4") {
  switch (activityType) {
    case "transactions_created":
      return <Icons.SyncAlt className={className} />;
    case "transactions_enriched":
      return <Icons.Bolt className={className} />;
    case "transactions_categorized":
    case "transaction_category_created":
      return <Icons.Category className={className} />;
    case "transactions_assigned":
      return <Icons.AccountCircle className={className} />;
    case "transactions_exported":
      return <Icons.ArrowOutward className={className} />;
    case "transaction_attachment_created":
      return <Icons.Attachments className={className} />;

    case "invoice_created":
      return <Icons.Invoice className={className} />;
    case "draft_invoice_created":
      return <Icons.Edit className={className} />;
    case "invoice_sent":
    case "invoice_reminder_sent":
      return <Icons.Email className={className} />;
    case "invoice_paid":
      return <Icons.CurrencyOutline className={className} />;
    case "invoice_overdue":
      return <Icons.Error className={className} />;
    case "invoice_scheduled":
      return <Icons.CalendarMonth className={className} />;
    case "invoice_cancelled":
      return <Icons.Block className={className} />;
    case "invoice_refunded":
      return <Icons.History className={className} />;
    case "invoice_duplicated":
      return <Icons.Copy className={className} />;

    case "inbox_new":
      return <Icons.ForwardToInbox className={className} />;
    case "inbox_auto_matched":
    case "inbox_match_confirmed":
      return <Icons.Match className={className} />;
    case "inbox_needs_review":
      return <Icons.Error className={className} />;
    case "inbox_cross_currency_matched":
      return <Icons.SyncAlt className={className} />;

    case "recurring_series_started":
    case "recurring_series_completed":
    case "recurring_series_paused":
    case "recurring_invoice_upcoming":
      return <Icons.Repeat className={className} />;

    case "customer_created":
      return <Icons.Customers className={className} />;

    case "tracker_entry_created":
    case "tracker_project_created":
      return <Icons.Tracker className={className} />;

    case "document_uploaded":
    case "document_processed":
      return <Icons.Description className={className} />;

    default:
      return <Icons.Notifications className={className} />;
  }
}
