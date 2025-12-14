import calApp from "./cal/config";
import fortnoxApp from "./fortnox/config";
import gmailApp from "./gmail/config-client";
import outlookApp from "./outlook/config-client";
import quickBooksApp from "./quick-books/config";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import vismaApp from "./visma/config";
import xeroApp from "./xero/config";
import zapierApp from "./zapier/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  raycastApp,
  quickBooksApp,
  xeroApp,
  calApp,
  fortnoxApp,
  vismaApp,
  zapierApp,
];
