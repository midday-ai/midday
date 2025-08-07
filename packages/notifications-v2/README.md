# @midday/notifications-v2

Modern notification system for Midday that replaces Novu with activities-based notifications and direct Resend integration.

## Features

- **Always creates activities** - Every notification creates an activity record
- **Direct email sending** - Uses Resend directly for better performance and reliability
- **Conditional emails** - Emails are sent based on notification type and user preferences
- **Type-safe** - Full TypeScript support with Zod validation
- **Extensible** - Easy to add new notification types
- **Batch support** - Efficient batch email sending with Resend

## Usage

```typescript
import { Notifications } from "@midday/notifications-v2";

const notifications = new Notifications(db);

// Create inbox notification for all team members - just the item data directly!
await notifications.create("inbox_new", teamId, {
  id: "inbox-123",
  displayName: "Invoice.pdf",
  fileName: "invoice.pdf", 
  contentType: "application/pdf",
  createdAt: "2024-01-15T10:00:00Z",
});

// Create transaction notification for all team members with priority override
await notifications.create("transactions_created", teamId, {
  transactions: newTransactions,
}, { priority: 3 });
```

### How it works

1. **Always creates activities** for all team members (for tracking/audit)
2. **Respects in-app preferences** - sets low priority if user disabled in-app notifications
3. **Conditionally sends emails** - only to users who have email notifications enabled
4. **Automatic user management** - fetches team members and transforms data internally

## Adding New Notification Types

1. Create a new file in `src/types/` (e.g., `invoice-paid.ts`)
2. Define the schema and handler
3. Import and add to the handlers object in `src/index.ts`

Example:

```typescript
// src/types/invoice-paid.ts
import { z } from "zod";
import { userSchema, invoiceSchema, type NotificationHandler } from "../base";

const schema = z.object({
  users: z.array(userSchema),
  invoice: invoiceSchema,
  priority: z.number().default(2),
  skipEmail: z.boolean().default(false),
});

export const invoicePaid: NotificationHandler<z.infer<typeof schema>> = {
  schema,
  activityType: 'invoice_paid',
  defaultPriority: 2,
  email: {
    template: 'invoice-paid',
    subject: 'invoice.paid.subject',
  },

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: 'invoice_paid',
    priority: data.priority,
    metadata: {
      invoiceId: data.invoice.id,
      invoiceNumber: data.invoice.number,
      amount: data.invoice.amount,
    },
  }),

  createEmail: (data, user) => ({
    template: 'invoice-paid',
    subject: 'invoice.paid.subject',
    user,
    data: { invoice: data.invoice },
  }),
};
```

## Priority System

- **1-3**: High priority notifications (show in notification center)
- **4-6**: Medium priority (insights and less urgent notifications)  
- **7-10**: Low priority (background activities, analytics only)

### Automatic Priority Adjustment

The system automatically adjusts notification priority and email delivery based on user preferences:

- **In-app enabled**: Activity created with normal priority (visible in notification center)
- **In-app disabled**: Activity created with low priority (7-10 range, not visible in notification center)
- **Email enabled**: Email delivered to user
- **Email disabled**: No email delivered to that user
- **Runtime priority override**: Always takes precedence over automatic adjustment

Note: Activities are always created for audit/tracking purposes, but their visibility is controlled by priority levels.