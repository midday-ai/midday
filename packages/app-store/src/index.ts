import chatgptMcpApp from "./chatgpt-mcp/config";
import claudeMcpApp from "./claude-mcp/config";
import copilotMcpApp from "./copilot-mcp/config";
import cursorMcpApp from "./cursor-mcp/config";
import deelApp from "./deel/config";
import dropboxApp from "./dropbox/config";
import eInvoiceApp from "./e-invoice/config";
import fortnoxApp from "./fortnox/config-client";
import gmailApp from "./gmail/config-client";
import googleDriveApp from "./google-drive/config";
import makeMcpApp from "./make-mcp/config";
import middayDesktopApp from "./midday-desktop/config";
import n8nMcpApp from "./n8n-mcp/config";
import opencodeMcpApp from "./opencode-mcp/config";
import outlookApp from "./outlook/config-client";
import perplexityMcpApp from "./perplexity-mcp/config";
import polarApp from "./polar/config";
import quickBooksApp from "./quick-books/config-client";
import raycastApp from "./raycast/config";
import raycastMcpApp from "./raycast-mcp/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import stripeApp from "./stripe/config";
import stripePaymentsApp from "./stripe-payments/config-client";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config-client";
import zapierMcpApp from "./zapier-mcp/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  quickBooksApp,
  xeroApp,
  fortnoxApp,
  whatsappApp,
  stripePaymentsApp,
  middayDesktopApp,
  raycastApp,
  googleDriveApp,
  dropboxApp,
  stripeApp,
  polarApp,
  deelApp,
  eInvoiceApp,
  cursorMcpApp,
  claudeMcpApp,
  perplexityMcpApp,
  raycastMcpApp,
  chatgptMcpApp,
  opencodeMcpApp,
  zapierMcpApp,
  copilotMcpApp,
  n8nMcpApp,
  makeMcpApp,
];
