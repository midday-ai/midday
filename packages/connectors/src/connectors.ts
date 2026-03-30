import type { ConnectorApp } from "./types";

export const connectorApps: ConnectorApp[] = [
  // Communication & Email
  {
    id: "connector-gmail",
    name: "Gmail",
    slug: "connector-gmail",
    category: "connector",
    active: true,
    short_description: "Search, read, and draft emails via the AI assistant",
    description:
      "Connect Gmail to let the AI assistant search your inbox, read email threads, and draft replies.",
    features: [
      "Search and read emails",
      "Draft replies from chat",
      "Read email threads",
    ],
  },
  {
    id: "connector-outlook",
    name: "Outlook",
    slug: "connector-outlook",
    category: "connector",
    active: true,
    short_description: "Manage emails and calendar in the Microsoft ecosystem",
    description:
      "Connect Outlook to let the AI assistant search emails, manage your calendar, and draft messages.",
    features: [
      "Search and read emails",
      "Manage calendar events",
      "Draft messages from chat",
    ],
  },
  {
    id: "connector-slack",
    name: "Slack",
    slug: "connector-slack",
    category: "connector",
    active: true,
    short_description: "Send messages and access Slack data from the assistant",
    description:
      "Connect Slack to let the AI assistant send messages, search channels, and fetch data.",
    features: [
      "Send and read messages",
      "Search channels",
      "Access workspace data",
    ],
  },
  {
    id: "connector-microsoft-teams",
    name: "Microsoft Teams",
    slug: "connector-microsoft-teams",
    category: "connector",
    active: true,
    short_description: "Access chats, channels, and files in Microsoft Teams",
    description:
      "Connect Microsoft Teams to let the AI assistant send messages, manage channels, and access shared files.",
    features: [
      "Send and read messages",
      "Manage channels and teams",
      "Access shared files",
    ],
  },

  // Calendar & Scheduling
  {
    id: "connector-google-calendar",
    name: "Google Calendar",
    slug: "connector-google-calendar",
    category: "connector",
    active: true,
    short_description: "Manage your schedule and coordinate meetings from chat",
    description:
      "Connect Google Calendar to let the AI assistant view, create, and manage calendar events.",
    features: [
      "View upcoming events",
      "Create and update events",
      "Check availability",
    ],
  },
  {
    id: "connector-calendly",
    name: "Calendly",
    slug: "connector-calendly",
    category: "connector",
    active: true,
    short_description:
      "Manage scheduling links and view bookings via the assistant",
    description:
      "Connect Calendly to let the AI assistant check upcoming meetings, manage event types, and view scheduling data.",
    features: [
      "View upcoming bookings",
      "Manage event types",
      "Check scheduling links",
    ],
  },
  {
    id: "connector-cal",
    name: "Cal.com",
    slug: "connector-cal",
    category: "connector",
    active: true,
    short_description: "Manage scheduling and bookings with Cal.com via AI",
    description:
      "Connect Cal.com to let the AI assistant manage event types, view bookings, and coordinate scheduling.",
    features: [
      "View upcoming bookings",
      "Manage event types",
      "Check availability",
    ],
  },

  // Video Conferencing
  {
    id: "connector-google-meet",
    name: "Google Meet",
    slug: "connector-google-meet",
    category: "connector",
    active: true,
    short_description: "Manage video meetings and calls with Google Meet",
    description:
      "Connect Google Meet to let the AI assistant create meetings, manage video calls, and coordinate participants.",
    features: [
      "Create and schedule meetings",
      "Manage meeting participants",
      "Access meeting details",
    ],
  },
  {
    id: "connector-zoom",
    name: "Zoom",
    slug: "connector-zoom",
    category: "connector",
    active: true,
    short_description: "Manage meetings and webinars in Zoom via AI",
    description:
      "Connect Zoom to let the AI assistant create meetings, manage participants, and access meeting recordings and transcripts.",
    features: [
      "Create and schedule meetings",
      "Manage participants and registrations",
      "Access recordings and transcripts",
    ],
  },

  // Documents, Knowledge & Storage
  {
    id: "connector-google-drive",
    name: "Google Drive",
    slug: "connector-google-drive",
    category: "connector",
    active: true,
    short_description: "Search, access, and organize files in Google Drive",
    description:
      "Connect Google Drive to let the AI assistant search files, read documents, and organize your cloud storage.",
    features: [
      "Search and access files",
      "Read document contents",
      "Organize folders",
    ],
  },
  {
    id: "connector-google-docs",
    name: "Google Docs",
    slug: "connector-google-docs",
    category: "connector",
    active: true,
    short_description: "Create and edit documents via the AI assistant",
    description:
      "Connect Google Docs to let the AI assistant create, read, and edit documents collaboratively.",
    features: [
      "Create and edit documents",
      "Read document content",
      "Collaborative editing",
    ],
  },
  {
    id: "connector-google-sheets",
    name: "Google Sheets",
    slug: "connector-google-sheets",
    category: "connector",
    active: true,
    short_description: "Read, write, and analyze spreadsheet data from chat",
    description:
      "Connect Google Sheets to let the AI assistant read data, update cells, and create spreadsheets for reporting.",
    features: [
      "Read and write data",
      "Create spreadsheets",
      "Analyze and summarize data",
    ],
  },
  {
    id: "connector-notion",
    name: "Notion",
    slug: "connector-notion",
    category: "connector",
    active: true,
    short_description:
      "Search, update, and manage your Notion workspace via AI",
    description:
      "Connect Notion to let the AI assistant search pages, create content, and manage databases.",
    features: [
      "Search pages and databases",
      "Create and update content",
      "Manage database entries",
    ],
  },
  {
    id: "connector-airtable",
    name: "Airtable",
    slug: "connector-airtable",
    category: "connector",
    active: true,
    short_description: "Query and manage Airtable bases from the AI assistant",
    description:
      "Connect Airtable to let the AI assistant read records, create entries, and manage your flexible databases.",
    features: [
      "Read and create records",
      "Query and filter data",
      "Manage bases and tables",
    ],
  },
  {
    id: "connector-dropbox",
    name: "Dropbox",
    slug: "connector-dropbox",
    category: "connector",
    active: true,
    short_description:
      "Access and manage files in Dropbox via the AI assistant",
    description:
      "Connect Dropbox to let the AI assistant search files, manage folders, and access your cloud storage.",
    features: [
      "Search and access files",
      "Upload and organize files",
      "Manage shared folders",
    ],
  },
  {
    id: "connector-one-drive",
    name: "OneDrive",
    slug: "connector-one-drive",
    category: "connector",
    active: true,
    short_description: "Access and manage files in Microsoft OneDrive via AI",
    description:
      "Connect OneDrive to let the AI assistant search files, manage documents, and access your Microsoft cloud storage.",
    features: [
      "Search and access files",
      "Manage documents and folders",
      "Share and collaborate on files",
    ],
  },
  {
    id: "connector-confluence",
    name: "Confluence",
    slug: "connector-confluence",
    category: "connector",
    active: true,
    short_description: "Search and manage Confluence wiki pages via AI",
    description:
      "Connect Confluence to let the AI assistant search pages, create content, and manage your team's knowledge base.",
    features: [
      "Search and read pages",
      "Create and update content",
      "Manage spaces and labels",
    ],
  },
  {
    id: "connector-coda",
    name: "Coda",
    slug: "connector-coda",
    category: "connector",
    active: true,
    short_description: "Access and manage Coda docs and tables via AI",
    description:
      "Connect Coda to let the AI assistant read docs, manage tables, and interact with your collaborative workspace.",
    features: [
      "Read and edit documents",
      "Manage tables and rows",
      "Access formulas and views",
    ],
  },

  // Project Management
  {
    id: "connector-linear",
    name: "Linear",
    slug: "connector-linear",
    category: "connector",
    active: true,
    short_description: "Manage issues and projects in Linear via the assistant",
    description:
      "Connect Linear to let the AI assistant create issues, manage projects, and track work.",
    features: [
      "Create and update issues",
      "Manage projects and cycles",
      "Search and filter tasks",
    ],
  },
  {
    id: "connector-jira",
    name: "Jira",
    slug: "connector-jira",
    category: "connector",
    active: true,
    short_description:
      "Create issues, track sprints, and manage projects in Jira",
    description:
      "Connect Jira to let the AI assistant create and update issues, manage sprints, and track project progress.",
    features: [
      "Create and update issues",
      "Manage sprints and boards",
      "Search with JQL",
    ],
  },
  {
    id: "connector-asana",
    name: "Asana",
    slug: "connector-asana",
    category: "connector",
    active: true,
    short_description: "Manage tasks, projects, and team workflows in Asana",
    description:
      "Connect Asana to let the AI assistant create tasks, manage projects, and coordinate team workflows.",
    features: [
      "Create and assign tasks",
      "Manage projects and sections",
      "Track progress and deadlines",
    ],
  },
  {
    id: "connector-clickup",
    name: "ClickUp",
    slug: "connector-clickup",
    category: "connector",
    active: true,
    short_description: "Manage tasks, docs, and goals in ClickUp from chat",
    description:
      "Connect ClickUp to let the AI assistant manage tasks, create docs, and track goals across your workspace.",
    features: [
      "Create and manage tasks",
      "Track goals and milestones",
      "Search across spaces",
    ],
  },
  {
    id: "connector-monday",
    name: "Monday.com",
    slug: "connector-monday",
    category: "connector",
    active: true,
    short_description: "Manage boards, items, and automations in Monday.com",
    description:
      "Connect Monday.com to let the AI assistant manage work items, update boards, and track team progress.",
    features: [
      "Create and update items",
      "Manage boards and groups",
      "Track work status",
    ],
  },
  {
    id: "connector-trello",
    name: "Trello",
    slug: "connector-trello",
    category: "connector",
    active: true,
    short_description: "Manage Trello boards, lists, and cards via AI",
    description:
      "Connect Trello to let the AI assistant create cards, manage boards, and track tasks in your kanban workflow.",
    features: [
      "Create and move cards",
      "Manage boards and lists",
      "Track task progress",
    ],
  },
  {
    id: "connector-wrike",
    name: "Wrike",
    slug: "connector-wrike",
    category: "connector",
    active: true,
    short_description:
      "Manage projects and tasks in Wrike via the AI assistant",
    description:
      "Connect Wrike to let the AI assistant manage tasks, track projects, and coordinate team workflows.",
    features: [
      "Create and assign tasks",
      "Track project timelines",
      "Manage folders and spaces",
    ],
  },
  {
    id: "connector-shortcut",
    name: "Shortcut",
    slug: "connector-shortcut",
    category: "connector",
    active: true,
    short_description: "Manage stories and epics in Shortcut via AI",
    description:
      "Connect Shortcut to let the AI assistant create stories, manage epics, and track product development.",
    features: [
      "Create and update stories",
      "Manage epics and milestones",
      "Track iteration progress",
    ],
  },
  {
    id: "connector-google-tasks",
    name: "Google Tasks",
    slug: "connector-google-tasks",
    category: "connector",
    active: true,
    short_description: "Manage to-do lists and tasks in Google Tasks via AI",
    description:
      "Connect Google Tasks to let the AI assistant create tasks, manage lists, and track your to-dos.",
    features: [
      "Create and complete tasks",
      "Manage task lists",
      "Set due dates and priorities",
    ],
  },
  {
    id: "connector-basecamp",
    name: "Basecamp",
    slug: "connector-basecamp",
    category: "connector",
    active: true,
    short_description:
      "Manage projects and team collaboration in Basecamp via AI",
    description:
      "Connect Basecamp to let the AI assistant manage projects, to-dos, and team communication in one place.",
    features: [
      "Manage projects and to-dos",
      "Access message boards",
      "Track schedules and milestones",
    ],
  },
  {
    id: "connector-todoist",
    name: "Todoist",
    slug: "connector-todoist",
    category: "connector",
    active: true,
    short_description: "Manage tasks and projects in Todoist via AI",
    description:
      "Connect Todoist to let the AI assistant create tasks, organize projects, and manage your to-do lists.",
    features: [
      "Create and complete tasks",
      "Organize projects and labels",
      "Set priorities and due dates",
    ],
  },

  // CRM & Sales
  {
    id: "connector-hubspot",
    name: "HubSpot",
    slug: "connector-hubspot",
    category: "connector",
    active: true,
    short_description: "Access CRM data and insights from the AI assistant",
    description:
      "Connect HubSpot to let the AI assistant access contacts, deals, and CRM insights.",
    features: [
      "Search contacts and deals",
      "View CRM insights",
      "Manage pipeline data",
    ],
  },
  {
    id: "connector-pipedrive",
    name: "Pipedrive",
    slug: "connector-pipedrive",
    category: "connector",
    active: true,
    short_description: "Manage deals, contacts, and your sales pipeline via AI",
    description:
      "Connect Pipedrive to let the AI assistant manage deals, search contacts, and track your sales pipeline.",
    features: [
      "Manage deals and pipeline",
      "Search and update contacts",
      "Track activities and notes",
    ],
  },
  {
    id: "connector-salesforce",
    name: "Salesforce",
    slug: "connector-salesforce",
    category: "connector",
    active: true,
    short_description: "Access Salesforce CRM data and manage records via AI",
    description:
      "Connect Salesforce to let the AI assistant query records, manage leads, and access CRM data.",
    features: [
      "Query and manage records",
      "Search leads and contacts",
      "View dashboards and reports",
    ],
  },
  {
    id: "connector-attio",
    name: "Attio",
    slug: "connector-attio",
    category: "connector",
    active: true,
    short_description: "Manage relationships and workflows in Attio CRM",
    description:
      "Connect Attio to let the AI assistant manage contacts, track relationships, and update your CRM workspace.",
    features: [
      "Manage contacts and companies",
      "Track relationships",
      "Update CRM records",
    ],
  },
  {
    id: "connector-zoho",
    name: "Zoho",
    slug: "connector-zoho",
    category: "connector",
    active: true,
    short_description: "Access Zoho CRM data and manage records via AI",
    description:
      "Connect Zoho to let the AI assistant manage contacts, deals, and access your CRM and marketing data.",
    features: [
      "Manage contacts and deals",
      "Access CRM modules",
      "Search and filter records",
    ],
  },
  {
    id: "connector-apollo",
    name: "Apollo",
    slug: "connector-apollo",
    category: "connector",
    active: true,
    short_description: "Search leads and manage outreach with Apollo via AI",
    description:
      "Connect Apollo to let the AI assistant search prospects, manage sequences, and access lead data for sales outreach.",
    features: [
      "Search and enrich leads",
      "Manage outreach sequences",
      "Access contact data",
    ],
  },
  {
    id: "connector-close",
    name: "Close",
    slug: "connector-close",
    category: "connector",
    active: true,
    short_description: "Manage sales pipeline and leads in Close CRM via AI",
    description:
      "Connect Close to let the AI assistant manage leads, track deals, and automate sales workflows in your CRM.",
    features: [
      "Manage leads and opportunities",
      "Track deal pipeline",
      "Log calls and emails",
    ],
  },
  {
    id: "connector-capsulecrm",
    name: "Capsule",
    slug: "connector-capsulecrm",
    category: "connector",
    active: true,
    short_description: "Manage contacts and sales in Capsule CRM via AI",
    description:
      "Connect Capsule to let the AI assistant manage contacts, track sales opportunities, and organize your customer relationships.",
    features: [
      "Manage contacts and organizations",
      "Track sales opportunities",
      "View tasks and activities",
    ],
  },
  {
    id: "connector-affinity",
    name: "Affinity",
    slug: "connector-affinity",
    category: "connector",
    active: true,
    short_description: "Track relationships and deals in Affinity via AI",
    description:
      "Connect Affinity to let the AI assistant track relationships, manage deal flow, and access relationship intelligence data.",
    features: [
      "Track relationships and interactions",
      "Manage deal pipeline",
      "Access relationship intelligence",
    ],
  },

  {
    id: "connector-linkedin",
    name: "LinkedIn",
    slug: "connector-linkedin",
    category: "connector",
    active: true,
    short_description:
      "Access LinkedIn for networking, posts, and lead generation",
    description:
      "Connect LinkedIn to let the AI assistant view your profile, manage connections, and interact with your professional network.",
    features: [
      "View profile and connections",
      "Create and manage posts",
      "Search people and companies",
    ],
  },

  // Design & Creative
  {
    id: "connector-figma",
    name: "Figma",
    slug: "connector-figma",
    category: "connector",
    active: true,
    short_description: "Access Figma designs and context from the AI assistant",
    description:
      "Connect Figma to let the AI assistant access design files and generate context from your designs.",
    features: ["Access design files", "Get design context", "Browse projects"],
  },
  {
    id: "connector-canva",
    name: "Canva",
    slug: "connector-canva",
    category: "connector",
    active: true,
    short_description: "Access and manage Canva designs from the AI assistant",
    description:
      "Connect Canva to let the AI assistant browse designs, access brand assets, and manage your visual content.",
    features: [
      "Browse designs and folders",
      "Access brand assets",
      "Manage visual content",
    ],
  },
  {
    id: "connector-miro",
    name: "Miro",
    slug: "connector-miro",
    category: "connector",
    active: true,
    short_description: "Access Miro boards and collaborate visually via AI",
    description:
      "Connect Miro to let the AI assistant access boards, create content, and collaborate on visual workflows.",
    features: [
      "Access and search boards",
      "Create visual content",
      "Manage board items",
    ],
  },
  {
    id: "connector-webflow",
    name: "Webflow",
    slug: "connector-webflow",
    category: "connector",
    active: true,
    short_description:
      "Manage Webflow sites, CMS, and content via the assistant",
    description:
      "Connect Webflow to let the AI assistant manage CMS content, update site data, and access project information.",
    features: [
      "Manage CMS collections",
      "Update site content",
      "Access project data",
    ],
  },

  // Developer Tools
  {
    id: "connector-github",
    name: "GitHub",
    slug: "connector-github",
    category: "connector",
    active: true,
    short_description: "Interact with repositories, issues, and PRs from chat",
    description:
      "Connect GitHub to let the AI assistant manage issues, pull requests, and repositories.",
    features: [
      "Create and manage issues",
      "Review pull requests",
      "Search repositories",
    ],
  },

  // Finance & Payments
  {
    id: "connector-stripe",
    name: "Stripe",
    slug: "connector-stripe",
    category: "connector",
    active: true,
    short_description:
      "Query payments, customers, and invoices in Stripe via AI",
    description:
      "Connect Stripe to let the AI assistant query payment data, search customers, and view invoice details.",
    features: [
      "Query payment history",
      "Search customers",
      "View invoices and subscriptions",
    ],
  },
  {
    id: "connector-freshbooks",
    name: "FreshBooks",
    slug: "connector-freshbooks",
    category: "connector",
    active: true,
    short_description: "Access invoices, expenses, and clients in FreshBooks",
    description:
      "Connect FreshBooks to let the AI assistant query invoices, manage expenses, and access client data.",
    features: [
      "Query invoices and expenses",
      "Manage client records",
      "View financial summaries",
    ],
  },
  {
    id: "connector-brex",
    name: "Brex",
    slug: "connector-brex",
    category: "connector",
    active: true,
    short_description: "Access card transactions and spend data from Brex",
    description:
      "Connect Brex to let the AI assistant query card transactions, view spend data, and manage expense categories.",
    features: [
      "Query card transactions",
      "View spend analytics",
      "Manage expense categories",
    ],
  },
  {
    id: "connector-quickbooks",
    name: "QuickBooks",
    slug: "connector-quickbooks",
    category: "connector",
    active: true,
    short_description: "Access QuickBooks accounting data via the AI assistant",
    description:
      "Connect QuickBooks to let the AI assistant query invoices, expenses, and financial reports alongside your native Midday integration.",
    features: [
      "Query invoices and expenses",
      "Access financial reports",
      "Manage customer records",
    ],
  },
  {
    id: "connector-zoho-books",
    name: "Zoho Books",
    slug: "connector-zoho-books",
    category: "connector",
    active: true,
    short_description: "Access Zoho Books accounting data via the AI assistant",
    description:
      "Connect Zoho Books to let the AI assistant manage invoices, expenses, payments, and financial reports alongside your Midday data.",
    features: [
      "Manage invoices and expenses",
      "Track payments and bank reconciliation",
      "Access financial reports",
      "Manage customers and vendors",
    ],
  },
  {
    id: "connector-xero",
    name: "Xero",
    slug: "connector-xero",
    category: "connector",
    active: false,
    short_description: "Access Xero accounting data via the AI assistant",
    description:
      "Connect Xero to let the AI assistant query invoices, bank transactions, and financial reports alongside your native Midday integration.",
    features: [
      "Query invoices and transactions",
      "Access financial reports",
      "Manage contacts and accounts",
    ],
  },
  {
    id: "connector-sage",
    name: "Sage",
    slug: "connector-sage",
    category: "connector",
    active: true,
    short_description: "Access Sage accounting data via the AI assistant",
    description:
      "Connect Sage to let the AI assistant manage invoices, track expenses, and access financial reports from your Sage account.",
    features: [
      "Manage invoices and bills",
      "Track expenses and payments",
      "Access financial reports",
    ],
  },
  {
    id: "connector-wave-accounting",
    name: "Wave",
    slug: "connector-wave-accounting",
    category: "connector",
    active: true,
    short_description: "Access Wave accounting data via the AI assistant",
    description:
      "Connect Wave to let the AI assistant manage invoices, track expenses, and access your free accounting data.",
    features: [
      "Manage invoices and receipts",
      "Track income and expenses",
      "Access financial reports",
    ],
  },

  {
    id: "connector-square",
    name: "Square",
    slug: "connector-square",
    category: "connector",
    active: true,
    short_description: "Access payments, customers, and orders from Square",
    description:
      "Connect Square to let the AI assistant query payment transactions, view customer data, and access order information.",
    features: [
      "Query payment transactions",
      "View customer data",
      "Access order information",
    ],
  },

  // HR & Recruiting
  {
    id: "connector-bamboohr",
    name: "BambooHR",
    slug: "connector-bamboohr",
    category: "connector",
    active: true,
    short_description: "Access employee and HR data in BambooHR via AI",
    description:
      "Connect BambooHR to let the AI assistant access employee records, time-off requests, and HR reports.",
    features: [
      "Access employee directory",
      "View time-off balances and requests",
      "Access HR reports",
    ],
  },
  {
    id: "connector-workable",
    name: "Workable",
    slug: "connector-workable",
    category: "connector",
    active: true,
    short_description: "Manage hiring and recruitment in Workable via AI",
    description:
      "Connect Workable to let the AI assistant track candidates, manage job postings, and access recruitment data.",
    features: [
      "Track candidates and applications",
      "Manage job postings",
      "Access hiring pipeline",
    ],
  },

  // Advertising & Marketing
  {
    id: "connector-google-ads",
    name: "Google Ads",
    slug: "connector-google-ads",
    category: "connector",
    active: true,
    short_description: "Access Google Ads campaigns and spend data via AI",
    description:
      "Connect Google Ads to let the AI assistant view campaign performance, track ad spend, and access advertising reports.",
    features: [
      "View campaign performance",
      "Track ad spend and ROI",
      "Access keyword and audience data",
    ],
  },
  {
    id: "connector-meta-ads",
    name: "Meta Ads",
    slug: "connector-meta-ads",
    category: "connector",
    active: true,
    short_description: "Access Facebook and Instagram ad data via AI",
    description:
      "Connect Meta Ads to let the AI assistant view campaign performance, track ad spend across Facebook and Instagram.",
    features: [
      "View campaign performance",
      "Track ad spend across platforms",
      "Access audience insights",
    ],
  },
  {
    id: "connector-semrush",
    name: "Semrush",
    slug: "connector-semrush",
    category: "connector",
    active: true,
    short_description: "Access SEO analytics and keyword data via AI",
    description:
      "Connect Semrush to let the AI assistant access keyword rankings, site audits, and competitor analysis data.",
    features: [
      "View keyword rankings",
      "Access site audit data",
      "Analyze competitor performance",
    ],
  },

  {
    id: "connector-mailchimp",
    name: "Mailchimp",
    slug: "connector-mailchimp",
    category: "connector",
    active: true,
    short_description:
      "Manage email campaigns, audiences, and analytics in Mailchimp",
    description:
      "Connect Mailchimp to let the AI assistant manage email campaigns, view audience data, and access campaign analytics.",
    features: [
      "Manage email campaigns",
      "View audience and subscriber data",
      "Access campaign analytics",
    ],
  },
  {
    id: "connector-google-analytics",
    name: "Google Analytics",
    slug: "connector-google-analytics",
    category: "connector",
    active: true,
    short_description:
      "Access website traffic and analytics data from Google Analytics",
    description:
      "Connect Google Analytics to let the AI assistant query website traffic, view user behavior, and access performance reports.",
    features: [
      "Query website traffic data",
      "View user behavior and conversions",
      "Access performance reports",
    ],
  },

  // Customer Support
  {
    id: "connector-intercom",
    name: "Intercom",
    slug: "connector-intercom",
    category: "connector",
    active: true,
    short_description: "Access conversations and customer data in Intercom",
    description:
      "Connect Intercom to let the AI assistant search conversations, view customer profiles, and access support data.",
    features: [
      "Search conversations",
      "View customer profiles",
      "Access support metrics",
    ],
  },
  {
    id: "connector-zendesk",
    name: "Zendesk",
    slug: "connector-zendesk",
    category: "connector",
    active: true,
    short_description:
      "Manage support tickets and customer data in Zendesk via AI",
    description:
      "Connect Zendesk to let the AI assistant search tickets, manage support requests, and access customer information.",
    features: [
      "Search and manage tickets",
      "View customer profiles",
      "Access knowledge base",
    ],
  },
  {
    id: "connector-freshdesk",
    name: "Freshdesk",
    slug: "connector-freshdesk",
    category: "connector",
    active: true,
    short_description:
      "Manage helpdesk tickets and customer support in Freshdesk",
    description:
      "Connect Freshdesk to let the AI assistant manage tickets, view customer data, and access your helpdesk.",
    features: [
      "Create and manage tickets",
      "View customer data",
      "Access knowledge base",
    ],
  },

  // E-commerce
  {
    id: "connector-shopify",
    name: "Shopify",
    slug: "connector-shopify",
    category: "connector",
    active: true,
    short_description: "Access orders, products, and store data from Shopify",
    description:
      "Connect Shopify to let the AI assistant query orders, manage products, and access store analytics.",
    features: [
      "Query orders and customers",
      "Manage products and inventory",
      "View store analytics",
    ],
  },

  // Signing & Contracts
  {
    id: "connector-docusign",
    name: "DocuSign",
    slug: "connector-docusign",
    category: "connector",
    active: true,
    short_description: "Manage documents and e-signatures with DocuSign via AI",
    description:
      "Connect DocuSign to let the AI assistant send documents for signing, track signature status, and manage agreements.",
    features: [
      "Send documents for signing",
      "Track signature status",
      "Manage envelopes and templates",
    ],
  },

  // Time Tracking
  {
    id: "connector-clockify",
    name: "Clockify",
    slug: "connector-clockify",
    category: "connector",
    active: true,
    short_description:
      "Access time entries, projects, and reports from Clockify",
    description:
      "Connect Clockify to let the AI assistant view time entries, manage projects, and pull time tracking reports.",
    features: [
      "View and manage time entries",
      "Access project data",
      "Pull time tracking reports",
    ],
  },
  {
    id: "connector-toggl",
    name: "Toggl",
    slug: "connector-toggl",
    category: "connector",
    active: true,
    short_description: "Access time tracking data and reports from Toggl",
    description:
      "Connect Toggl to let the AI assistant view time entries, manage projects, and access detailed time reports.",
    features: [
      "View and manage time entries",
      "Access project and client data",
      "Pull detailed time reports",
    ],
  },
  {
    id: "connector-harvest",
    name: "Harvest",
    slug: "connector-harvest",
    category: "connector",
    active: true,
    short_description: "Access time tracking and invoicing data from Harvest",
    description:
      "Connect Harvest to let the AI assistant view time entries, access project budgets, and pull invoicing data.",
    features: [
      "View time entries and timesheets",
      "Access project budgets",
      "Pull invoicing and expense data",
    ],
  },

  // Meetings & Transcription
  {
    id: "connector-fireflies",
    name: "Fireflies",
    slug: "connector-fireflies",
    category: "connector",
    active: true,
    short_description: "Access meeting transcripts and notes from Fireflies",
    description:
      "Connect Fireflies to let the AI assistant search meeting transcripts, access notes, and retrieve key action items.",
    features: [
      "Search meeting transcripts",
      "Access meeting summaries",
      "Retrieve action items",
    ],
  },
  {
    id: "connector-granola",
    name: "Granola",
    slug: "connector-granola",
    category: "connector",
    active: true,
    short_description:
      "Access meeting notes, transcripts, and AI summaries from Granola",
    description:
      "Connect Granola to let the AI assistant search meeting notes, retrieve transcripts, access AI-generated summaries, and query meetings using natural language.",
    features: [
      "Search and query meeting notes",
      "Access meeting transcripts",
      "Retrieve AI-generated summaries",
      "Browse meetings by date range",
    ],
  },
];
