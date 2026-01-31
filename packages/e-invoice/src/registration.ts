/**
 * DDD Invoices Team Registration
 * Registers Midday teams as sub-accounts under Midday's DDD organization
 */

import { logger } from "@midday/logger";

const DDD_API_URL =
  process.env.DDD_INVOICES_API_URL || "https://api.dddinvoices.com";

// Midday's organization credentials in DDD
const MIDDAY_ORG_ID = "3bfca2c7-fdbc-11f0-90f7-0050564db057";
const MIDDAY_ADMIN_ID = "05dc3ffd-9a4a-41ae-a173-75e0a174fbb4";

export interface TeamRegistrationData {
  name: string;
  countryCode: string;
  taxId?: string | null;
  registrationNumber?: string | null;
  addressLine1?: string | null;
  zip?: string | null;
  city?: string | null;
  email?: string | null;
}

interface AddCustomerResponse {
  Status: "OK" | "Error";
  Reason?: string;
  Code?: number;
  Result?: {
    Status: "OK" | "Error";
    Reason?: string;
    Result?: {
      ConnectionKey: string;
    };
  };
}

/**
 * Register a Midday team with DDD Invoices
 * This creates a sub-account under Midday's organization
 *
 * @param team - Team company details
 * @returns The connection key for the newly registered team
 * @throws Error if registration fails
 */
export async function registerTeamWithDDD(
  team: TeamRegistrationData,
): Promise<string> {
  const connectionKey = process.env.DDD_INVOICES_API_KEY;

  if (!connectionKey) {
    throw new Error("DDD_INVOICES_API_KEY is not configured");
  }

  logger.info("Registering team with DDD Invoices", {
    teamName: team.name,
    countryCode: team.countryCode,
  });

  const response = await fetch(
    `${DDD_API_URL}/api/service/EUeInvoices.AddCustomer`,
    {
      method: "POST",
      headers: {
        Authorization: `IoT ${connectionKey}:EUeInvoices`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        MyOrgId: MIDDAY_ORG_ID,
        CustomerObj: {
          CustomerName: team.name,
          CustomerCountryCode: team.countryCode,
          CustomerTaxNum: team.taxId || undefined,
          CustomerVatNum: team.taxId || undefined,
          CustomerRegNum: team.registrationNumber || undefined,
          CustomerAddress: team.addressLine1 || undefined,
          CustomerPostCode: team.zip || undefined,
          CustomerCityName: team.city || undefined,
          CustomerEmail: team.email || undefined,
          MyAccessAsAdmin: true,
          MyAccessAsAdminId: MIDDAY_ADMIN_ID,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("DDD AddCustomer HTTP error", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(
      `DDD registration failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AddCustomerResponse;

  // Check top-level error
  if (data.Status === "Error") {
    logger.error("DDD AddCustomer error", {
      reason: data.Reason,
      code: data.Code,
    });
    throw new Error(
      `DDD registration failed: ${data.Reason || "Unknown error"}`,
    );
  }

  // Check nested result error
  if (data.Result?.Status !== "OK") {
    logger.error("DDD AddCustomer result error", {
      reason: data.Result?.Reason,
    });
    throw new Error(
      `DDD registration failed: ${data.Result?.Reason || "Unknown error"}`,
    );
  }

  const newConnectionKey = data.Result.Result?.ConnectionKey;

  if (!newConnectionKey) {
    logger.error("DDD AddCustomer missing connection key", { data });
    throw new Error("DDD registration failed: No connection key returned");
  }

  logger.info("Team registered with DDD Invoices successfully", {
    teamName: team.name,
  });

  return newConnectionKey;
}
