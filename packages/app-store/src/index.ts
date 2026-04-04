import chatgptMcpApp from "./chatgpt-mcp/config";
import claudeMcpApp from "./claude-mcp/config";
import clineMcpApp from "./cline-mcp/config";
import copilotMcpApp from "./copilot-mcp/config";
import cursorMcpApp from "./cursor-mcp/config";
import eInvoiceApp from "./e-invoice/config";
import fortnoxApp from "./fortnox/config-client";
import geminiMcpApp from "./gemini-mcp/config";
import gmailApp from "./gmail/config-client";
import imessageApp from "./imessage/config-client";
import makeMcpApp from "./make-mcp/config";
import manusMcpApp from "./manus-mcp/config";
import middayDesktopApp from "./midday-desktop/config";
import n8nMcpApp from "./n8n-mcp/config";
import opencodeMcpApp from "./opencode-mcp/config";
import outlookApp from "./outlook/config-client";
import perplexityMcpApp from "./perplexity-mcp/config";
import quickBooksApp from "./quick-books/config-client";
import raycastMcpApp from "./raycast-mcp/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import stripePaymentsApp from "./stripe-payments/config-client";
import telegramApp from "./telegram/config-client";
import whatsappApp from "./whatsapp/config-client";
import windsurfMcpApp from "./windsurf-mcp/config";
import xeroApp from "./xero/config-client";
import zapierMcpApp from "./zapier-mcp/config";
import zedMcpApp from "./zed-mcp/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  telegramApp,
  quickBooksApp,
  xeroApp,
  fortnoxApp,
  whatsappApp,
  imessageApp,
  stripePaymentsApp,
  middayDesktopApp,
  eInvoiceApp,
  cursorMcpApp,
  claudeMcpApp,
  perplexityMcpApp,
  raycastMcpApp,
  chatgptMcpApp,
  geminiMcpApp,
  opencodeMcpApp,
  zapierMcpApp,
  copilotMcpApp,
  n8nMcpApp,
  makeMcpApp,
  windsurfMcpApp,
  clineMcpApp,
  zedMcpApp,
  manusMcpApp,
];
