export const CURATED_TOOLKIT_SLUGS = [
  // Communication & Email
  "gmail",
  "outlook",
  "slack",
  "microsoft_teams",
  // Calendar & Scheduling
  "googlecalendar",
  "calendly",
  "cal",

  // Video Conferencing
  "googlemeet",
  "zoom",

  // Documents, Knowledge & Storage
  "googledrive",
  "googledocs",
  "googlesheets",
  "notion",
  "airtable",
  "dropbox",
  "one_drive",
  "confluence",
  "coda",

  // Project Management
  "linear",
  "jira",
  "asana",
  "clickup",
  "monday",
  "trello",
  "wrike",
  "shortcut",
  "googletasks",
  "basecamp",
  "todoist",

  // CRM & Sales
  "hubspot",
  "pipedrive",
  "salesforce",
  "attio",
  "zoho",
  "apollo",
  "close",
  "capsulecrm",
  "affinity",
  "linkedin",

  // Design & Creative
  "figma",
  "canva",
  "miro",
  "webflow",

  // Developer Tools
  "github",

  // Finance & Payments
  "stripe",
  "freshbooks",
  "brex",
  "quickbooks",
  "zoho_books",
  "sage",
  "wave_accounting",
  "square",

  // HR & Recruiting
  "bamboohr",
  "workable",

  // Advertising & Marketing
  "googleads",
  "metaads",
  "semrush",
  "mailchimp",
  "google_analytics",

  // Customer Support
  "intercom",
  "zendesk",
  "freshdesk",

  // E-commerce
  "shopify",

  // Signing & Contracts
  "docusign",

  // Time Tracking
  "clockify",
  "toggl",
  "harvest",

  // Meetings & Transcription
  "fireflies",
  "granola_mcp",
] as const;

export type CuratedToolkitSlug = (typeof CURATED_TOOLKIT_SLUGS)[number];

/**
 * Maps connector IDs (with underscores) to Composio's actual API slugs
 * where they differ from the underscore convention.
 */
const COMPOSIO_SLUG_OVERRIDES: Record<string, string> = {
  google_calendar: "googlecalendar",
  google_drive: "googledrive",
  google_docs: "googledocs",
  google_sheets: "googlesheets",
  google_meet: "googlemeet",
  google_tasks: "googletasks",
  google_ads: "googleads",
  meta_ads: "metaads",
  granola: "granola_mcp",
};

/**
 * Converts a connector app ID (e.g. "connector-google-calendar")
 * to the corresponding Composio toolkit slug (e.g. "googlecalendar").
 */
export function toComposioSlug(connectorId: string): string {
  const base = connectorId.replace("connector-", "").replace(/-/g, "_");
  return COMPOSIO_SLUG_OVERRIDES[base] ?? base;
}

const COMPOSIO_LOGO_BASE = "https://logos.composio.dev/api";

export function getConnectorLogoUrl(connectorId: string): string {
  return `${COMPOSIO_LOGO_BASE}/${toComposioSlug(connectorId)}`;
}
