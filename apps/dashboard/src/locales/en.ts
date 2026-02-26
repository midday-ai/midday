export default {
  transaction_methods: {
    card_purchase: "Card Purchase",
    payment: "Payment",
    card_atm: "Card ATM",
    transfer: "Transfer",
    other: "Other",
    ach: "Ach",
    deposit: "Deposit",
    wire: "Wire",
    fee: "Fee",
    interest: "Interest",
  },
  language: {
    title: "Languages",
    description: "Change the language used in the user interface.",
    placeholder: "Select language",
  },
  locale: {
    title: "Locale",
    searchPlaceholder: "Search locale",
    description:
      "Sets the region and language preferences for currency, dates, and other locale-specific formats.",
    placeholder: "Select locale",
  },
  languages: {
    en: "English",
    sv: "Swedish",
  },
  timezone: {
    title: "Time Zone",
    searchPlaceholder: "Search timezone",
    description:
      "Defines the default time zone used for displaying times in the app.",
    placeholder: "Select timezone",
  },
  spending_period: {
    last_30d: "Last 30 days",
    this_month: "This month",
    last_month: "Last month",
    this_year: "This year",
    last_year: "Last year",
  },
  widget_period: {
    fiscal_ytd: "Fiscal YTD",
    fiscal_year: "Fiscal Year",
    current_quarter: "Current Quarter",
    trailing_12: "Last 12 Months",
    current_month: "Current Month",
  },
  transactions_period: {
    all: "All",
    income: "Income",
    expense: "Expense",
  },
  transaction_frequency: {
    weekly: "Weekly recurring",
    monthly: "Monthly recurring",
    annually: "Annually recurring",
  },
  inbox_filter: {
    all: "All",
    todo: "Todo",
    done: "Done",
  },
  chart_type: {
    profit: "Profit",
    revenue: "Revenue",
    expense: "Expenses",
    burn_rate: "Burn rate",
  },
  folders: {
    all: "All",
    exports: "Exports",
    inbox: "Inbox",
    imports: "Imports",
    transactions: "Transactions",
    deals: "Deals",
  },
  mfa_status: {
    verified: "Verified",
    unverified: "Unverified",
  },
  roles: {
    owner: "Admin",
    admin: "Admin",
    member: "Team Member",
    broker: "Broker",
    syndicate: "Syndicate",
    merchant: "Merchant",
  },
  notifications: {
    categories: {
      transactions: "Transactions",
      deals: "Deals",
      inbox: "Inbox",
    },
    transactions_created: {
      name: "New Transactions",
      description: "Get notified when new transactions are imported",
      "title#one": "New transaction from {name} {amount} on {date}",
      "title#other": "{count} new transactions added",
      "title_many#other": "{count} transactions imported",
      single_transaction: "New transaction from {name} {amount} on {date}",
    },
    deal_paid: {
      name: "Paid",
      description: "Get notified when deals are paid",
      title: "Deal payment received",
      subtitle: "Your deal has been paid",
      manual_with_date:
        "Deal {dealNumber} from {merchantName} marked as paid on {date}",
      manual_with_date_no_merchant:
        "Deal {dealNumber} marked as paid on {date}",
      manual: "Deal {dealNumber} from {merchantName} marked as paid",
      manual_no_merchant: "Deal {dealNumber} marked as paid",
      automatic: "Payment received for deal {dealNumber}",
    },
    deal_overdue: {
      name: "Overdue",
      description: "Get notified when deals become overdue",
      title: "Deal is overdue",
      subtitle: "Payment is past due date",
      with_number: "Deal {dealNumber} is now overdue",
    },
    deal_scheduled: {
      name: "Scheduled",
      description: "Get notified when deals are scheduled for sending",
      title: "Deal scheduled",
      subtitle: "Deal has been scheduled for automatic delivery",
      with_merchant:
        "Deal {dealNumber} scheduled to be sent to {merchantName} on {date} at {time}",
      without_merchant:
        "Deal {dealNumber} scheduled for {date} at {time}",
      simple: "Deal {dealNumber} has been scheduled",
    },
    deal_sent: {
      name: "Sent",
      description: "Get notified when deals are successfully sent",
      title: "Deal sent",
      subtitle: "Deal has been delivered to merchant",
      with_merchant: "Deal {dealNumber} sent to {merchantName}",
      without_merchant: "Deal {dealNumber} has been sent",
    },
    deal_reminder_sent: {
      name: "Reminder Sent",
      description: "Get notified when deal reminders are sent",
      title: "Deal reminder sent",
      subtitle: "Payment reminder has been sent to merchant",
      with_merchant:
        "Payment reminder sent to {merchantName} for deal {dealNumber}",
      without_merchant: "Payment reminder sent for deal {dealNumber}",
    },

    deal_cancelled: {
      name: "Cancelled",
      description: "Get notified when deals are cancelled",
      title: "Deal cancelled",
      subtitle: "Deal has been cancelled",
      with_merchant:
        "Deal {dealNumber} for {merchantName} has been cancelled",
      without_merchant: "Deal {dealNumber} has been cancelled",
    },
    deal_created: {
      name: "Created",
      description: "Get notified when new deals are created",
      title: "Deal created",
      subtitle: "A new deal has been created",
      with_merchant_and_amount:
        "Deal {dealNumber} created for {merchantName} - {amount}",
      with_merchant: "Deal {dealNumber} created for {merchantName}",
      without_merchant: "Deal {dealNumber} has been created",
    },
    deal_refunded: {
      name: "Refunded",
      description: "Get notified when deal payments are refunded",
      title: "Deal refunded",
      subtitle: "Deal payment has been refunded",
      with_merchant:
        "Deal {dealNumber} for {merchantName} has been refunded",
      without_merchant: "Deal {dealNumber} has been refunded",
    },
    recurring_series_started: {
      name: "Recurring Series Started",
      description: "Get notified when a new recurring deal series begins",
      title: "Recurring deal series started",
      with_merchant_and_count:
        "Started {frequency} recurring series for {merchantName} ({count} deals)",
      with_merchant: "Started {frequency} recurring series for {merchantName}",
      with_frequency: "Started {frequency} recurring deal series",
    },
    recurring_series_completed: {
      name: "Recurring Series Completed",
      description: "Get notified when a recurring deal series finishes",
      title: "Recurring deal series completed",
      with_merchant_and_count:
        "Recurring series for {merchantName} completed ({count} deals generated)",
      with_count:
        "Recurring deal series completed ({count} deals generated)",
    },
    recurring_series_paused: {
      name: "Recurring Series Paused",
      description: "Get notified when a recurring deal series is paused",
      title: "Recurring deal series paused",
      with_merchant: "Recurring series for {merchantName} has been paused",
      auto_failure_with_merchant:
        "Recurring series for {merchantName} paused after {failureCount} failed attempts",
      auto_failure:
        "Recurring series paused after {failureCount} failed attempts",
    },
    recurring_deal_upcoming: {
      name: "Upcoming Recurring Deal",
      description:
        "Get notified 24 hours before a recurring deal is generated",
      title: "Upcoming deal generation",
      batch: "You have {count} deal(s) scheduled for tomorrow",
      single_with_details:
        "A {amount} deal for {merchantName} is scheduled for tomorrow",
      single_with_merchant:
        "An deal for {merchantName} is scheduled for tomorrow",
    },
    inbox_new: {
      name: "New Inbox Items",
      description: "Get notified when new items arrive in your inbox",
      "type.email#one": "New document received via team inbox email",
      "type.email#other": "{count} new documents received via team inbox email",
      "type.sync#one": "New document synced from your {provider} account",
      "type.sync#other":
        "{count} new documents synced from your {provider} account",
      "type.upload#one": "New document uploaded to your inbox",
      "type.upload#other": "{count} new documents uploaded to your inbox",
      // Fallback titles (shouldn't be used with new implementation)
      "title#one": "We found a new document in your inbox",
      "title#other": "We found {count} new documents in your inbox",
      "upload_title#one": "A new document was uploaded to your inbox",
      "upload_title#other": "{count} new documents were uploaded to your inbox",
    },
    inbox_auto_matched: {
      name: "Auto-matched",
      description:
        "Get notified when documents are automatically matched with transactions",
      title: "Document automatically matched",
      with_details:
        '"{documentName}" ({amount}) was matched with "{transactionName}"',
      with_names: '"{documentName}" was matched with "{transactionName}"',
      cross_currency_details:
        '"{documentName}" ({documentAmount}) was matched with "{transactionName}" ({transactionAmount}) across currencies',
    },
    inbox_high_confidence: {
      name: "High Confidence Match",
      description:
        "Get notified when high-confidence matches are found that likely need confirmation",
      title: "Likely match found",
      with_details:
        '"{documentName}" ({amount}) looks like it matches "{transactionName}" — click to review',
      with_names:
        '"{documentName}" looks like it matches "{transactionName}" — click to review',
      cross_currency_details:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
    },
    inbox_needs_review: {
      name: "Needs Review",
      description:
        "Get notified when potential matches are found that need your review",
      title: "Possible match found",
      with_details:
        '"{documentName}" ({amount}) might match "{transactionName}" — click to review',
      with_names:
        '"{documentName}" might match "{transactionName}" — click to review',
      high_confidence_details:
        '"{documentName}" ({amount}) looks like it matches "{transactionName}" — click to review',
      high_confidence_names:
        '"{documentName}" looks like it matches "{transactionName}" — click to review',
      cross_currency_high_confidence:
        '"{documentName}" ({documentAmount}) looks like it matches "{transactionName}" ({transactionAmount}) across currencies — click to review',
      cross_currency_suggested:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
    },
    inbox_cross_currency_matched: {
      name: "Cross-currency Match",
      description:
        "Get notified when documents are matched with transactions in different currencies",
      title: "Cross-currency match found",
      with_details:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
      with_names:
        '"{documentName}" might match "{transactionName}" across currencies — click to review',
      high_confidence_details:
        '"{documentName}" ({documentAmount}) looks like it matches "{transactionName}" ({transactionAmount}) across currencies — click to review',
      high_confidence_names:
        '"{documentName}" looks like it matches "{transactionName}" across currencies — click to review',
    },
    default: {
      title: "New activity detected",
    },
    archive_button: "Archive notification",
    time_ago: "{time} ago",
  },
  widgets: {
    insights: "Assistant",
    inbox: "Inbox",
    spending: "Spending",
    transactions: "Transactions",
  },
  account_type: {
    depository: "Depository",
    credit: "Credit",
    other_asset: "Other Asset",
    loan: "Loan",
    other_liability: "Other Liability",
  },
  tags: {
    bylaws: "Bylaws",
    shareholder_agreements: "Shareholder Agreements",
    board_meeting: "Board Meeting",
    corporate_policies: "Corporate Policies",
    annual_reports: "Annual Reports",
    budget_reports: "Budget Reports",
    audit_reports: "Audit Reports",
    tax_returns: "Tax Returns",
    deals_and_receipts: "Deals & Receipts",
    employee_handbook: "Employee Handbook",
    payroll_records: "Payroll Records",
    performance_reviews: "Performance Reviews",
    employee_training_materials: "Employee Training Materials",
    benefits_documentation: "Benefits Documentation",
    termination_letters: "Termination Letters",
    patents: "Patents",
    trademarks: "Trademarks",
    copyrights: "Copyrights",
    client_contracts: "Client Contracts",
    financial_records: "Financial Records",
    compliance_reports: "Compliance Reports",
    regulatory_filings: "Regulatory Filings",
    advertising_copy: "Advertising Copy",
    press_releases: "Press Releases",
    branding_guidelines: "Branding Guidelines",
    market_research_reports: "Market Research Reports",
    campaign_performance_reports: "Campaign Performance Reports",
    customer_surveys: "Customer Surveys",
    quality_control_reports: "Quality Control Reports",
    inventory_reports: "Inventory Reports",
    maintenance_logs: "Maintenance Logs",
    production_schedules: "Production Schedules",
    vendor_agreements: "Vendor Agreements",
    supplier_agreements: "Supplier Agreements",
    sales_contracts: "Sales Contracts",
    sales_reports: "Sales Reports",
    client_proposals: "Client Proposals",
    customer_order_forms: "Customer Order Forms",
    sales_presentations: "Sales Presentations",
    data_security_plans: "Data Security Plans",
    system_architecture_diagrams: "System Architecture Diagrams",
    incident_response_plans: "Incident Response Plans",
    user_manuals: "User Manuals",
    software_licenses: "Software Licenses",
    data_backup_logs: "Data Backup Logs",
    project_plans: "Project Plans",
    task_lists: "Task Lists",
    risk_management_plans: "Risk Management Plans",
    project_status_reports: "Project Status Reports",
    meeting_agendas: "Meeting Agendas",
    lab_notebooks: "Lab Notebooks",
    experiment_results: "Experiment Results",
    product_design_documents: "Product Design Documents",
    prototypes_and_models: "Prototypes & Models",
    testing_reports: "Testing Reports",
    newsletters: "Newsletters",
    email_correspondence: "Email Correspondence",
    support_tickets: "Support Tickets",
    faqs_and_knowledge: "FAQs & Knowledge",
    user_guides: "User Guides",
    warranty_information: "Warranty Information",
    swot_analysis: "SWOT Analysis",
    strategic_objectives: "Strategic Objectives",
    roadmaps: "Roadmaps",
    competitive_analysis: "Competitive Analysis",
    safety_data_sheets: "Safety Data Sheets",
    compliance_certificates: "Compliance Certificates",
    incident_reports: "Incident Reports",
    emergency_response_plans: "Emergency Response Plans",
    certification_records: "Certification Records",
    training_schedules: "Training Schedules",
    e_learning_materials: "E-learning Materials",
    competency_assessment_forms: "Competency Assessment Forms",
  },
  deal_status: {
    draft: "Draft",
    overdue: "Overdue",
    paid: "Paid",
    unpaid: "Unpaid",
    canceled: "Canceled",
    scheduled: "Scheduled",
    refunded: "Refunded",
  },
  payment_status: {
    none: "Unknown",
    good: "Good",
    average: "Average",
    bad: "Bad",
  },
  payment_status_description: {
    none: "No payment history yet",
    good: "Consistently pay on time",
    average: "Mostly on time",
    bad: "Room for improvement",
  },
  "deal_count#zero": "No deals",
  "deal_count#one": "1 deal",
  "deal_count#other": "{count} deals",
  account_balance: {
    total_balance: "Total balance",
  },
  transaction_categories: {
    // Parent Categories
    revenue: "Income and money received from business activities",
    "cost-of-goods-sold":
      "Direct costs associated with producing goods or services",
    "sales-marketing":
      "Expenses related to sales activities and marketing efforts",
    operations: "Day-to-day operational costs of running the business",
    "professional-services":
      "Fees paid to external professionals and service providers",
    "human-resources":
      "Employee-related costs including salaries, benefits, and training",
    "travel-entertainment":
      "Business travel, meals, and entertainment expenses",
    technology: "Software, hardware, and technology-related expenses",
    "banking-finance":
      "Banking fees, loan payments, and financial transactions",
    "assets-capex": "Capital expenditures and asset acquisitions",
    "liabilities-debt": "Debt obligations and deferred revenue",
    taxes: "Tax payments and government fees",
    "owner-equity": "Owner investments, draws, and equity transactions",
    system: "System-generated categories for uncategorized transactions",

    // Child Categories - Revenue
    income: "General business income from various sources",
    "product-sales": "Revenue from selling physical or digital products",
    "service-revenue": "Income from providing services to customers",
    "consulting-revenue": "Revenue from consulting and advisory services",
    "subscription-revenue": "Recurring income from subscription-based services",
    "interest-income": "Earnings from interest on investments or loans",
    "other-income": "Miscellaneous income not classified elsewhere",
    "customer-refunds": "Money returned to customers for refunds",
    "chargebacks-disputes": "Revenue adjustments from payment disputes",

    // Child Categories - Cost of Goods Sold
    inventory: "Cost of goods held for sale",
    manufacturing: "Production costs for manufacturing goods",
    "shipping-inbound": "Costs for receiving goods and materials",
    "duties-customs": "Import duties and customs fees",

    // Child Categories - Sales & Marketing
    marketing: "Marketing campaign and promotional expenses",
    advertising: "Paid advertising and media placement costs",
    website: "Website development, hosting, and maintenance",
    events: "Trade shows, conferences, and event expenses",
    "promotional-materials":
      "Brochures, business cards, and marketing materials",

    // Child Categories - Operations
    "office-supplies": "Office materials and stationery",
    rent: "Office, warehouse, or equipment rental costs",
    utilities: "Electricity, water, gas, and other utility bills",
    "facilities-expenses": "Building maintenance and facility costs",
    equipment: "Non-capital equipment purchases and maintenance",
    "internet-and-telephone": "Internet, phone, and communication services",
    shipping: "Outbound shipping and delivery costs",

    // Child Categories - Professional Services
    "professional-services-fees": "Legal, accounting, and consulting fees",
    contractors: "Payments to independent contractors and freelancers",
    insurance: "Business insurance premiums and coverage",

    // Child Categories - Human Resources
    salary: "Employee wages and salaries",
    training: "Employee training and development costs",
    "employer-taxes": "Payroll taxes and employer contributions",
    benefits: "Employee benefits and health insurance",

    // Child Categories - Travel & Entertainment
    travel: "Business travel expenses including transportation",
    meals: "Business meal and dining expenses",
    activity: "Entertainment and team building activities",

    // Child Categories - Technology
    software: "Software licenses and subscriptions",
    "non-software-subscriptions": "Non-software subscription services",

    // Child Categories - Banking & Finance
    transfer: "Bank transfers between accounts",
    "credit-card-payment":
      "Payments to credit cards. Excluded from reports to avoid double-counting expenses",
    "banking-fees": "Bank account maintenance and transaction fees",
    "loan-proceeds": "Money received from loans and financing",
    "loan-principal-repayment": "Principal payments on loans",
    "interest-expense": "Interest paid on loans and credit",
    payouts: "Payment platform payouts to business",
    "processor-fees": "Payment processing and transaction fees",
    fees: "General banking and financial fees",

    // Child Categories - Assets
    "fixed-assets": "Long-term assets like buildings and equipment",
    "prepaid-expenses": "Advance payments for future services",

    // Child Categories - Liabilities & Debt
    leases: "Equipment and property lease payments",
    "deferred-revenue": "Advance payments received for future services",

    // Child Categories - Taxes & Government
    "vat-gst-pst-qst-payments": "Value-added tax and sales tax payments",
    "sales-use-tax-payments": "Sales and use tax obligations",
    "income-tax-payments": "Income tax payments and installments",
    "payroll-tax-remittances": "Employee tax withholdings and remittances",
    "government-fees": "Government licensing and regulatory fees",

    // Child Categories - Owner / Equity
    "owner-draws": "Money withdrawn by business owners",
    "capital-investment": "Owner investments in the business",
    "charitable-donations": "Charitable contributions and donations",

    // Child Categories - System
    uncategorized: "Transactions that haven't been classified yet",
    other: "Miscellaneous transactions not fitting other categories",
    "internal-transfer":
      "Transfers between your own accounts. Excluded from reports to avoid double-counting",
  },
  tax_summary: {
    title: {
      vat: "VAT Summary",
      gst: "GST Summary",
      sales_tax: "Sales Tax Summary",
      default: "Tax Summary",
    },
    collected: {
      vat: "VAT collected",
      gst: "GST collected",
      sales_tax: "Sales tax collected",
      default: "Tax collected",
    },
    paid: {
      vat: "VAT paid",
      gst: "GST paid",
      sales_tax: "Tax on purchases",
      default: "Tax paid",
    },
    to_remit: "To Remit",
    credit: "Credit",
    no_activity: "No tax activity",
    balanced: "Balanced",
    year_to_date: "Year-to-date ({year})",
    remit_amount: "{amount} to remit",
    credit_amount: "{amount} credit",
    open_assistant: "Open taxes assistant",
  },
  overdue_deals: {
    title: "Overdue Deals",
    all_paid: "All deals paid on time",
    "description#one": "{count} deal · Oldest {days} {dayText} overdue",
    "description#other": "{count} deals · Oldest {days} {dayText} overdue",
    "day#one": "day",
    "day#other": "days",
    view_overdue: "View overdue deals",
  },
  portal: {
    nav: {
      home: "Home",
      payments: "Payments",
      deals: "Deals",
      documents: "Docs",
      help: "Help",
    },
    home: {
      title: "Dashboard",
      remaining_balance: "Remaining Balance",
      next_payment: "Next Payment",
      estimated_payoff: "Estimated Payoff",
      progress: "Progress",
      paid_off: "paid off",
      no_active_payments: "No active payments",
      all_paid: "All paid!",
      today: "Today",
      based_on_schedule: "Based on your current payment schedule",
    },
    payments: {
      title: "Payment History",
      no_payments: "No payments found",
      completed: "Completed",
      returned: "Returned",
      pending: "Pending",
      failed: "Failed",
      all: "All",
      payment_type: "Payment Type",
      balance_after: "Balance After",
      description: "Description",
    },
    deals: {
      title: "Your Deals",
      all_deals_combined: "All Deals Combined",
      total_balance: "Total Balance",
      total_paid: "Total Paid",
      amount_received: "Amount You Received",
      total_pay_back: "Total You Pay Back",
      cost_of_funding: "Cost of Funding",
      daily_payment: "Daily Payment",
      weekly_payment: "Weekly Payment",
      monthly_payment: "Monthly Payment",
      payment_frequency: "Payment Frequency",
      every_business_day: "Every business day",
      every_week: "Every week",
      every_month: "Every month",
      started: "Started",
      expected_payoff: "Expected Payoff",
      remaining_balance: "Remaining Balance",
      show_advanced: "Show Advanced Details",
      hide_advanced: "Hide Advanced Details",
      factor_rate: "Factor Rate",
      holdback_percentage: "Holdback Percentage",
      deal_code: "Deal Code",
      nsf_warning: "returned payment(s) on record",
    },
    payoff: {
      title: "Request Payoff",
      current_balance: "Current Balance",
      payoff_amount: "Payoff Amount",
      good_through: "Good Through",
      no_penalty: "Your payoff amount is the remaining balance. There is no additional discount or penalty for early payoff.",
      request_letter: "Request Payoff Letter",
      verify_to_request: "Verify Email to Request",
      verify_email: "Verify Your Email",
      enter_email: "Enter the email address on file for your account to receive a verification code.",
      send_code: "Send Code",
      enter_code: "Enter Verification Code",
      check_email: "Check your email for a verification link or paste the code below.",
      verify: "Verify",
      requested: "Requested",
      generated: "Generated",
      sent: "Sent",
      previous_requests: "Previous Requests",
      letter_requested: "Payoff letter requested! You will receive it via email.",
    },
    documents: {
      title: "Documents",
      no_documents: "No documents available",
      no_documents_hint: "Documents will appear here when uploaded by your funder.",
      contracts: "Contracts",
      disclosures: "Disclosures",
      payoff_letters: "Payoff Letters",
      statements: "Statements",
      tax_documents: "Tax Documents",
      other: "Other",
    },
    help: {
      title: "Help & Support",
      contact_funder: "Contact Your Funder",
      call_us: "Call Us",
      email_us: "Email Us",
      faq: "Frequently Asked Questions",
      send_message: "Send Us a Message",
      message_sent: "Message sent!",
      reply_time: "We will reply to your email within 1 business day.",
      send_another: "Send another message",
      your_email: "Your Email",
      subject: "Subject (optional)",
      message: "Message",
    },
    notifications: {
      title: "Notifications",
      no_notifications: "No notifications yet",
    },
  },
} as const;
