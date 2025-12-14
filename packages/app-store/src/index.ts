import calApp from "./cal/config";
import fortnoxApp from "./fortnox/config";
import quickBooksApp from "./quick-books/config";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import vismaApp from "./visma/config";
import xeroApp from "./xero/config";
import zapierApp from "./zapier/config";

export const apps = [
  slackApp,
  raycastApp,
  quickBooksApp,
  xeroApp,
  calApp,
  fortnoxApp,
  vismaApp,
  zapierApp,
];
