# Example Usage

Here's how to use the new notifications system with direct Resend integration:

## Basic Transaction Notification

```typescript
import { Notifications } from "@midday/notifications-v2";

const notifications = new Notifications(db);

// Send transaction notification (creates activity + sends email with inbox reply-to)
const result = await notifications.send('transactions_created', {
  users: [
    {
      user: {
        id: "user-123",
        full_name: "John Doe", 
        email: "john@example.com",
        locale: "en"
      },
      team_id: "team-456",
      team: {
        name: "Acme Corp",
        inbox_id: "inbox-789"
      }
    }
  ],
  transactions: [
    {
      id: "txn-001",
      name: "Office Supplies",
      amount: -45.99,
      currency: "USD",
      date: "2024-01-15"
    }
  ]
}, {
  priority: 3, // User notification level
  skipEmail: false,
  // Runtime email overrides
  replyTo: getInboxEmail("custom-inbox-123"), // Custom reply-to
});

console.log(result);
// {
//   type: 'transactions_created',
//   activities: 1,
//   emails: { sent: 1, skipped: 0, failed: 0 }
// }
```

## Invoice Notification (No Inbox Reply)

```typescript
// Send invoice paid notification (system notification, no inbox reply-to)
await notifications.send('invoice_paid', {
  users: [userData],
  invoice: {
    id: "inv-001",
    number: "INV-2024-001",
    amount: 1200.00,
    currency: "USD",
    due_date: "2024-02-15",
    status: "paid"
  }
}, {
  priority: 2,
  skipEmail: false,
  from: "Billing <billing@midday.ai>", // Custom from address
});
```

## Enrichment Notification (Activities Only)

```typescript
// Send enrichment notification (activity only, no email)
await notifications.send('transactions_enriched', {
  users: usersData,
  transactions: enrichedTransactions,
}, {
  priority: 6, // Insights level - won't show in notification center
  skipEmail: true, // No email for enrichment
});
```

## Runtime Email Options

You can override email settings at runtime:

```typescript
await notifications.send('transactions_created', { users, transactions }, {
  // Override default settings
  priority: 1,                    // High priority notification
  skipEmail: false,               // Ensure email is sent
  from: "Custom <custom@midday.ai>", // Override from address
  replyTo: getInboxEmail("team-inbox"), // Custom reply-to
  headers: {                      // Additional headers
    "X-Campaign": "onboarding",
    "X-Priority": "high"
  }
});
```

## Benefits of Direct Resend Integration

✅ **No middleware** - Direct API calls to Resend  
✅ **Better performance** - No Novu overhead  
✅ **Batch support** - Efficient bulk email sending  
✅ **Better error handling** - Direct response from Resend  
✅ **Simpler architecture** - One less service to maintain  
✅ **Cost effective** - No Novu subscription needed  
✅ **Runtime flexibility** - Override any email setting per call  

## Configurable Email Options

Each notification type can configure email behavior:

```typescript
// In notification type definition
email: {
  template: "transactions",
  subject: "transactions.subject",
  from: "Custom Sender <custom@midday.ai>", // Optional custom from
}

// Or via createEmail function for full control
createEmail: (data, user) => ({
  template: "invoice-paid",
  subject: "invoice.paid.subject",
  user,
  data: { invoice: data.invoice },
  replyTo: "billing@midday.ai", // Custom reply-to
  headers: { "X-Custom-Header": "value" }, // Custom headers
})
```

## Email Templates

The system automatically maps notification types to email templates:

- `transactions_created` → `@midday/email/emails/transactions` (uses inbox reply-to)
- `invoice_paid` → `@midday/email/emails/invoice-paid` (system notification)
- `invoice_overdue` → `@midday/email/emails/invoice-overdue`

## Environment Variables

Make sure you have `RESEND_API_KEY` set in your environment.