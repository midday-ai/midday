# Runtime Options API

The new notifications system supports runtime options for maximum flexibility.

## API Signature

```typescript
await notifications.send(type, data, options?)
```

Where:
- `type`: Notification type (`'transactions_created'`, `'invoice_paid'`, etc.)
- `data`: Type-specific data (users, transactions, invoices, etc.)
- `options`: Optional runtime overrides

## Runtime Options

```typescript
interface NotificationOptions {
  priority?: number;           // Override activity priority (1-10)
   from?: string;              // Override from address
  replyTo?: string;           // Override reply-to address  
  headers?: Record<string, string>; // Additional email headers
}
```

## Examples

### Basic Usage (No Options)
```typescript
// Uses all handler defaults
await notifications.send('transactions_created', {
  users: usersData,
  transactions: newTransactions,
});
```

### With Custom Reply-To
```typescript
import { getInboxEmail } from "@midday/inbox";

// Set reply-to at runtime - much cleaner!
await notifications.send('transactions_created', {
  users: usersData,
  transactions: newTransactions,
}, {
  replyTo: getInboxEmail(userData.team.inbox_id), 
});
```

### High Priority Notification
```typescript
// Override priority for urgent notifications
await notifications.send('transactions_created', {
  users: usersData,
  transactions: urgentTransactions,
}, {
  priority: 1, // High priority (shows in notification center)
  from: "Urgent <urgent@midday.ai>",
  headers: {
    "X-Priority": "high",
    "X-Urgent": "true"
  }
});
```

### Skip Email for Bulk Operations
```typescript
// Create activities but skip emails for bulk imports
await notifications.send('transactions_created', {
  users: usersData,
  transactions: bulkTransactions,
}, {
  priority: 8,     // Insights level (no notification center)
  skipEmail: true, // No email spam
});
```

### Custom Sender for Special Cases
```typescript
// Override sender for marketing/onboarding
await notifications.send('invoice_paid', {
  users: [user],
  invoice: paidInvoice,
}, {
  from: "Pontus from Midday <pontus@midday.ai>",
  replyTo: "support@midday.ai",
  headers: {
    "X-Campaign": "payment-success",
  }
});
```

## Priority Hierarchy

Runtime options override handler defaults:

1. **Runtime options** (highest priority)
2. **Handler `createEmail` function** 
3. **Handler `email` config**
4. **Service defaults** (lowest priority)

## Use Cases

- **Dynamic reply-to routing**: `replyTo: getInboxEmail(team.inbox_id)` ✨ **Your use case!**
- **Urgent notifications**: `priority: 1, from: "Urgent <...>"`
- **Bulk operations**: `skipEmail: true, priority: 8`
- **A/B testing**: Different `from` addresses or headers
- **Special campaigns**: Custom headers for tracking
- **Context-specific routing**: Different reply-to based on context

**Much cleaner than `useInboxReply` flags!** Just specify what you want directly. 🎯