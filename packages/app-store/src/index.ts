import clearBooksApp from "./accounting/clear-books/config";
import dynamics365BCApp from "./accounting/dynamics-365-bc/config";
import dynamics365FOApp from "./accounting/dynamics-365-fo/config";
import freeAgentApp from "./accounting/free-agent/config";
import freshBooksApp from "./accounting/fresh-books/config";
import moneyBirdApp from "./accounting/money-bird/config";
import oracleNetSuiteApp from "./accounting/oracle-netsuite/config";
import quickBooksApp from "./accounting/quick-books/config";
import sageIntacctApp from "./accounting/sage-intacct/config";
import sageApp from "./accounting/sage/config";
import waveApp from "./accounting/wave/config";
import workdayApp from "./accounting/workday/config";
import xeroApp from "./accounting/xero/config";
import zohoApp from "./accounting/zoho/config";
import slackApp from "./assistant/slack/config";
import * as types from "./types";

import microsoftTeamsApp from "./assistant/microsoft-teams/config";
import notionApp from "./assistant/notion/config";

// Add new imports for CRM integrations
import acceloApp from "./crm/accelo/config";
import activeCampaignApp from "./crm/active-campaign/config";
import affinityApp from "./crm/affinity/config";
import capsuleApp from "./crm/capsule/config";
import closeApp from "./crm/close/config";
import copperApp from "./crm/copper/config";
import dynamics365App from "./crm/dynamics-365/config";
import hubspotApp from "./crm/hubspot/config";
import insightlyApp from "./crm/insightly/config";
import keapApp from "./crm/keap/config";
import nutshellApp from "./crm/nutshell/config";
import pipedriveApp from "./crm/pipedrive/config";
import pipelinerApp from "./crm/pipeliner/config";
import salesforceApp from "./crm/salesforce/config";
import sugarCrmApp from "./crm/sugar-crm/config";
import teamleaderApp from "./crm/teamleader/config";
import teamworkCrmApp from "./crm/teamwork-crm/config";
import vtigerApp from "./crm/vtiger/config";
import zendeskApp from "./crm/zendesk/config";
import zohoCrmApp from "./crm/zoho-crm/config";

// Add new imports for Banking integrations
import amazonApp from "./banking/amazon/config";
import ebayApp from "./banking/ebay/config";
import etsyApp from "./banking/etsy/config";
import paypalApp from "./banking/paypal/config";
import shopifyApp from "./banking/shopify/config";
import squareApp from "./banking/square/config";
import stripeApp from "./banking/stripe/config";
import venmoApp from "./banking/venmo/config";

// Update Payroll integrations imports
import adpApp from "./payroll/adp";
import bambooHRApp from "./payroll/bamboo-hr";
import deelApp from "./payroll/deel";
import gustoApp from "./payroll/gusto";
import paychexApp from "./payroll/paychex";
import sagePayrollApp from "./payroll/sage";
import workdayPayrollApp from "./payroll/workday";
import zohoPeopleApp from "./payroll/zoho-people";

// Partition apps by category
export const apps = {
  [types.IntegrationCategory.Accounting]: [
    quickBooksApp,
    clearBooksApp,
    freeAgentApp,
    freshBooksApp,
    dynamics365BCApp,
    dynamics365FOApp,
    moneyBirdApp,
    oracleNetSuiteApp,
    sageApp,
    sageIntacctApp,
    waveApp,
    workdayApp,
    xeroApp,
    zohoApp,
  ],
  [types.IntegrationCategory.Assistant]: [
    slackApp,
    notionApp,
    microsoftTeamsApp,
  ],
  [types.IntegrationCategory.Payroll]: [
    zohoPeopleApp,
    bambooHRApp,
    deelApp,
    adpApp,
    gustoApp,
    paychexApp,
    sagePayrollApp,
    workdayPayrollApp,
  ],
  [types.IntegrationCategory.Banking]: [
    stripeApp,
    squareApp,
    venmoApp,
    amazonApp,
    ebayApp,
    etsyApp,
    paypalApp,
    shopifyApp,
  ],
  [types.IntegrationCategory.CRM]: [
    acceloApp,
    activeCampaignApp,
    affinityApp,
    capsuleApp,
    closeApp,
    copperApp,
    vtigerApp,
    hubspotApp,
    insightlyApp,
    keapApp,
    dynamics365App,
    nutshellApp,
    pipedriveApp,
    zendeskApp,
    pipelinerApp,
    salesforceApp,
    sugarCrmApp,
    teamleaderApp,
    teamworkCrmApp,
    zohoCrmApp,
  ],
  [types.IntegrationCategory.Notification]: [],
};

export { types };
