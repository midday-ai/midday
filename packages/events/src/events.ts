export const LogEvents = {
  SignIn: {
    name: "User Signed In",
    channel: "login",
  },
  SignOut: {
    name: "User Signed Out",
    channel: "login",
  },
  ChangeTeam: {
    name: "Change Team",
    channel: "team",
  },
  Registered: {
    name: "User Registered",
    channel: "registered",
  },
  ConnectBankCompleted: {
    name: "Connect Bank Completed",
    channel: "bank",
  },
  ConnectBankProvider: {
    name: "Connect Bank Provider",
    channel: "bank",
  },
  ConnectBankCanceled: {
    name: "Connect Bank Canceled",
    channel: "bank",
  },
  ConnectBankAuthorized: {
    name: "Connect Bank Authorized",
    channel: "bank",
  },
  GoCardLessLinkFailed: {
    name: "GoCardLess Link Failed",
    channel: "gocardless",
  },
  ConnectBankFailed: {
    name: "Connect Bank Failed",
    channel: "bank",
  },
  BankAccountCreate: {
    name: "Create Bank Account",
    channel: "bank",
  },
  DeleteBank: {
    name: "Delete Bank",
    channel: "bank",
  },
  UpdateBank: {
    name: "Update Bank",
    channel: "bank",
  },
  ExportTransactions: {
    name: "Export Transaction",
    channel: "transaction",
  },
  TransactionsManualSync: {
    name: "Manual Sync",
    channel: "transaction",
  },
  CreateFolder: {
    name: "Create Folder",
    channel: "vault",
  },
  DeleteFolder: {
    name: "Delete Folder",
    channel: "vault",
  },
  DeleteFile: {
    name: "Delete File",
    channel: "vault",
  },
  ShareFile: {
    name: "Share File",
    channel: "vault",
  },
  MfaVerify: {
    name: "MFA Verify",
    channel: "security",
  },
  InboxInbound: {
    name: "Inbox Inbound",
    channel: "inbox",
  },
  ImportTransactions: {
    name: "Import Transactions",
    channel: "import",
  },
  SupportTicket: {
    name: "Support Ticket",
    channel: "support",
  },
  SendFeedback: {
    name: "Send Feedback",
    channel: "feedback",
  },
  UpdateBaseCurrency: {
    name: "Update Base Currency",
    channel: "transaction",
  },
  UpdateCurrency: {
    name: "Update Currency",
    channel: "transaction",
  },
  GoCardLessLinkCreated: {
    name: "GoCardLess Link Created",
    channel: "gocardless",
  },
  InboxConnected: {
    name: "Inbox Connected",
    channel: "inbox",
  },
  InboxUpload: {
    name: "Inbox Upload",
    channel: "inbox",
  },
  ReconnectConnection: {
    name: "Reconnect Connection",
    channel: "bank",
  },
  EnableBankingLinkReconnected: {
    name: "Enable Banking Link Reconnected",
    channel: "enablebanking",
  },
  EnableBankingLinkCreated: {
    name: "Enable Banking Link Created",
    channel: "enablebanking",
  },
  EnableBankingLinkFailed: {
    name: "Enable Banking Link Failed",
    channel: "enablebanking",
  },
  DeleteConnection: {
    name: "Delete Connection",
    channel: "bank",
  },
  OnboardingStarted: {
    name: "Onboarding Started",
    channel: "onboarding",
  },
  OnboardingStepViewed: {
    name: "Onboarding Step Viewed",
    channel: "onboarding",
  },
  OnboardingTeamCreated: {
    name: "Onboarding Team Created",
    channel: "onboarding",
  },
  OnboardingBankConnected: {
    name: "Onboarding Bank Connected",
    channel: "onboarding",
  },
  OnboardingBankSkipped: {
    name: "Onboarding Bank Skipped",
    channel: "onboarding",
  },
  OnboardingInboxConnected: {
    name: "Onboarding Inbox Connected",
    channel: "onboarding",
  },
  OnboardingInboxSkipped: {
    name: "Onboarding Inbox Skipped",
    channel: "onboarding",
  },
  OnboardingStepCompleted: {
    name: "Onboarding Step Completed",
    channel: "onboarding",
  },
  OnboardingCompleted: {
    name: "Onboarding Completed",
    channel: "onboarding",
  },
  CTA: {
    name: "CTA Clicked",
    channel: "website",
  },
  CheckoutStarted: {
    name: "Checkout Started",
    channel: "billing",
  },
  CheckoutCompleted: {
    name: "Checkout Completed",
    channel: "billing",
  },
  SubscriptionCanceled: {
    name: "Subscription Canceled",
    channel: "billing",
  },

  // Assistant
  AssistantOpened: {
    name: "Assistant Opened",
    channel: "assistant",
  },
  AssistantMessageSent: {
    name: "Assistant Message Sent",
    channel: "assistant",
  },
  AssistantNewChat: {
    name: "Assistant New Chat",
    channel: "assistant",
  },
  AssistantQuickAction: {
    name: "Assistant Quick Action",
    channel: "assistant",
  },
  AssistantSuggestionUsed: {
    name: "Assistant Suggestion Used",
    channel: "assistant",
  },
  AssistantModeChanged: {
    name: "Assistant Mode Changed",
    channel: "assistant",
  },
  AssistantFileAttached: {
    name: "Assistant File Attached",
    channel: "assistant",
  },
  AssistantStopped: {
    name: "Assistant Stopped",
    channel: "assistant",
  },

  // Connectors
  ConnectorModalOpened: {
    name: "Connector Modal Opened",
    channel: "connectors",
  },
  ConnectorConnected: {
    name: "Connector Connected",
    channel: "connectors",
  },
  ConnectorDisconnected: {
    name: "Connector Disconnected",
    channel: "connectors",
  },
  ConnectorViewed: {
    name: "Connector Viewed",
    channel: "connectors",
  },

  // MCP
  McpAppSelected: {
    name: "MCP App Selected",
    channel: "mcp",
  },
  McpBannerDismissed: {
    name: "MCP Banner Dismissed",
    channel: "mcp",
  },

  // Transactions
  TransactionCreated: {
    name: "Transaction Created",
    channel: "transaction",
  },
  TransactionUpdated: {
    name: "Transaction Updated",
    channel: "transaction",
  },
  TransactionDeleted: {
    name: "Transaction Deleted",
    channel: "transaction",
  },
  TransactionCategoryChanged: {
    name: "Transaction Category Changed",
    channel: "transaction",
  },
  TransactionAttachmentAdded: {
    name: "Transaction Attachment Added",
    channel: "transaction",
  },

  // Invoices
  InvoiceCreated: {
    name: "Invoice Created",
    channel: "invoice",
  },
  InvoiceSent: {
    name: "Invoice Sent",
    channel: "invoice",
  },
  InvoiceDeleted: {
    name: "Invoice Deleted",
    channel: "invoice",
  },
  InvoiceDuplicated: {
    name: "Invoice Duplicated",
    channel: "invoice",
  },
  InvoiceReminderSent: {
    name: "Invoice Reminder Sent",
    channel: "invoice",
  },
  RecurringInvoiceCreated: {
    name: "Recurring Invoice Created",
    channel: "invoice",
  },
  InvoicePaid: {
    name: "Invoice Paid",
    channel: "invoice",
  },

  // Inbox
  InboxMatched: {
    name: "Inbox Matched",
    channel: "inbox",
  },
  InboxUnmatched: {
    name: "Inbox Unmatched",
    channel: "inbox",
  },
  InboxItemDeleted: {
    name: "Inbox Item Deleted",
    channel: "inbox",
  },
  InboxBulkDeleted: {
    name: "Inbox Bulk Deleted",
    channel: "inbox",
  },
  InboxEmailConnected: {
    name: "Inbox Email Connected",
    channel: "inbox",
  },

  // Tracker
  TrackerStarted: {
    name: "Tracker Started",
    channel: "tracker",
  },
  TrackerStopped: {
    name: "Tracker Stopped",
    channel: "tracker",
  },
  TrackerProjectCreated: {
    name: "Tracker Project Created",
    channel: "tracker",
  },
  TrackerProjectDeleted: {
    name: "Tracker Project Deleted",
    channel: "tracker",
  },
  TrackerEntryCreated: {
    name: "Tracker Entry Created",
    channel: "tracker",
  },
  TrackerInvoiceCreated: {
    name: "Tracker Invoice Created",
    channel: "tracker",
  },

  // Vault
  VaultFileUploaded: {
    name: "Vault File Uploaded",
    channel: "vault",
  },
  VaultTagAssigned: {
    name: "Vault Tag Assigned",
    channel: "vault",
  },
  VaultFileDeleted: {
    name: "Vault File Deleted",
    channel: "vault",
  },
  VaultFileShared: {
    name: "Vault File Shared",
    channel: "vault",
  },
  VaultFileDownloaded: {
    name: "Vault File Downloaded",
    channel: "vault",
  },

  // Customers
  CustomerCreated: {
    name: "Customer Created",
    channel: "customer",
  },
  CustomerDeleted: {
    name: "Customer Deleted",
    channel: "customer",
  },
  CustomerEnriched: {
    name: "Customer Enriched",
    channel: "customer",
  },

  // Team & Settings
  MemberInvited: {
    name: "Member Invited",
    channel: "team",
  },
  MemberRemoved: {
    name: "Member Removed",
    channel: "team",
  },
  ApiKeyCreated: {
    name: "API Key Created",
    channel: "settings",
  },
  ApiKeyDeleted: {
    name: "API Key Deleted",
    channel: "settings",
  },
  ThemeChanged: {
    name: "Theme Changed",
    channel: "settings",
  },
  AccountDeleted: {
    name: "Account Deleted",
    channel: "settings",
  },

  // Cross-cutting
  CopiedToClipboard: {
    name: "Copied to Clipboard",
    channel: "general",
  },
  SearchOpened: {
    name: "Search Opened",
    channel: "general",
  },
};
