import deelApp from "./deel/config";
import dropboxApp from "./dropbox/config-client";
import fortnoxApp from "./fortnox/config";
import gmailApp from "./gmail/config-client";
import googleDriveApp from "./google-drive/config";
import outlookApp from "./outlook/config-client";
import quickBooksApp from "./quick-books/config";
import raycastApp from "./raycast/config";
// Import client config for dashboard (includes images)
import slackApp from "./slack/config-client";
import vismaApp from "./visma/config";
import whatsappApp from "./whatsapp/config-client";
import xeroApp from "./xero/config";

export const apps = [
  gmailApp,
  outlookApp,
  slackApp,
  whatsappApp,
  dropboxApp,
  googleDriveApp,
  raycastApp,
  quickBooksApp,
  xeroApp,
  fortnoxApp,
  vismaApp,
  deelApp,
];
