import deelApp from "./deel/config";
import dropboxApp from "./dropbox/config";
import eInvoiceApp from "./e-invoice/config";
import fortnoxApp from "./fortnox/config-client";
import gmailApp from "./gmail/config-client";
import googleDriveApp from "./google-drive/config";
import middayDesktopApp from "./midday-desktop/config";
import outlookApp from "./outlook/config-client";
import polarApp from "./polar/config";
import quickBooksApp from "./quick-books/config-client";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import stripePaymentsApp from "./stripe-payments/config-client";
import stripeApp from "./stripe/config";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config-client";

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
];
