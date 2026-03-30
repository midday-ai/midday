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

  // CRM & Sales
  "hubspot",
  "pipedrive",
  "salesforce",
  "attio",
  "zoho",
  "apollo",

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
  "xero",

  // Customer Support
  "intercom",
  "zendesk",
  "freshdesk",

  // E-commerce
  "shopify",

  // Signing & Contracts
  "docusign",

  // Meetings & Transcription
  "fireflies",
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
