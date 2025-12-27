import calApp from "./cal/config";
import fortnoxApp from "./fortnox/config-client";
import gmailApp from "./gmail/config-client";
import outlookApp from "./outlook/config-client";
import quickBooksApp from "./quick-books/config-client";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config-client";
import zapierApp from "./zapier/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  quickBooksApp,
  xeroApp,
  fortnoxApp,
  whatsappApp,
  raycastApp,
  calApp,
  zapierApp,
];
