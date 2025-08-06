# Email Configuration Guide

The notifications system provides flexible email configuration per notification type.

## Configuration Levels

### 1. Handler-Level Configuration (Recommended)

Configure email options in the notification handler:

```typescript
export const transactionsCreated: NotificationHandler = {
  // ... other config
  email: {
    template: "transactions",
    subject: "transactions.subject",
    from: "Midday <middaybot@midday.ai>", // Optional: custom from address
    replyTo: "support@midday.ai", // Optional: custom reply-to address
  },
  // ... rest of handler
};
```

### 2. Custom Email Function (Full Control)

Override email options per notification:

```typescript
export const invoicePaid: NotificationHandler = {
  // ... other config
  createEmail: (data, user) => ({
    template: "invoice-paid",
    subject: "invoice.paid.subject", 
    user,
    data: { invoice: data.invoice },
    from: "Billing <billing@midday.ai>",
    replyTo: "support@midday.ai",
    headers: {
      "X-Invoice-ID": data.invoice.id,
      "X-Priority": "high",
    },
  }),
};
```

## Email Options Reference

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `template` | `string` | Email template name | `"transactions"` |
| `subject` | `string` | i18n subject key | `"transactions.subject"` |
| `from` | `string?` | Custom from address | `"Custom <custom@midday.ai>"` |
| `replyTo` | `string?` | Custom reply-to address | `"support@midday.ai"` |
| `headers` | `Record<string, string>?` | Custom email headers | `{"X-Type": "notification"}` |


## Common Patterns

### Transactional Emails (Custom Reply-To)
```typescript
email: {
  template: "transactions",
  subject: "transactions.subject",
  // Set replyTo at runtime via options.replyTo = getInboxEmail(team.inbox_id)
}
```

### System Notifications (No Reply Expected)
```typescript
email: {
  template: "invoice-paid",
  subject: "invoice.paid.subject", 
  from: "Midday <middaybot@midday.ai>",
  // No replyTo - system notification
}
```

### Marketing/Onboarding (Custom Sender)
```typescript
email: {
  template: "welcome",
  subject: "welcome.subject",
  from: "Pontus from Midday <pontus@midday.ai>",
}
```

### Support/Billing (Custom Reply-To)
```typescript
createEmail: (data, user) => ({
  template: "billing-issue",
  subject: "billing.issue.subject",
  user,
  data,
  replyTo: "billing@midday.ai",
})
```

## Priority by Configuration Method

1. **`createEmail` function** - Highest priority, full control
2. **Handler `email` config** - Medium priority, declarative
3. **Service defaults** - Lowest priority, fallback

The system merges configurations, with higher priority options overriding lower ones.

## Default Behavior

- **From**: `"Midday <middaybot@midday.ai>"`
- **Reply-To**: None (unless custom `replyTo` is set)
- **Headers**: `{"X-Entity-Ref-ID": nanoid()}` (always added)
- **Preferences**: Always checked for all email notifications