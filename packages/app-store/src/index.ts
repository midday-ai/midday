import calApp from "./cal/config";
import fortnoxApp from "./fortnox/config";
import gmailApp from "./gmail/config-client";
import outlookApp from "./outlook/config-client";
import quickBooksApp from "./quick-books/config";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import stripeApp from "./stripe/config-client";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config";
import zapierApp from "./zapier/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  stripeApp,
  whatsappApp,
  raycastApp,
  quickBooksApp,
  xeroApp,
  calApp,
  fortnoxApp,
  zapierApp,
];
