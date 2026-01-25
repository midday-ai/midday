import chatgptMcpApp from "./chatgpt-mcp/config";
import claudeMcpApp from "./claude-mcp/config";
import cursorMcpApp from "./cursor-mcp/config";
import dropboxApp from "./dropbox/config";
import eInvoiceApp from "./e-invoice/config";
import fortnoxApp from "./fortnox/config-client";
import gmailApp from "./gmail/config-client";
import googleDriveApp from "./google-drive/config";
import outlookApp from "./outlook/config-client";
import quickBooksApp from "./quick-books/config-client";
import raycastMcpApp from "./raycast-mcp/config";
import stripePaymentsApp from "./stripe-payments/config-client";
import stripeApp from "./stripe/config";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config-client";

export const apps = [
  gmailApp,
  outlookApp,
  quickBooksApp,
  xeroApp,
  fortnoxApp,
  whatsappApp,
  stripePaymentsApp,
  googleDriveApp,
  dropboxApp,
  stripeApp,
  eInvoiceApp,
  cursorMcpApp,
  claudeMcpApp,
  raycastMcpApp,
  chatgptMcpApp,
];
