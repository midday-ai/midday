"use server";

import { initializeBackendClient } from "@/utils/backend";
import { engine } from "@/utils/engine";
import { logger } from "@/utils/logger"; // Assume you have a logger utility
import { FinancialUserProfileType, PlaidSyncAccountFromAccessTokenOperationRequest, PlaidSyncAccountFromAccessTokenRequest } from "@solomon-ai/client-typescript-sdk";
import { z } from "zod";

const exchangePublicTokenPropSchema = z.object({
  publicToken: z.string().min(1),
  institutionId: z.string().min(1),
  institutionName: z.string().min(1),
  userId: z.string().min(1),
});

type ExchangePublicTokenPropSchemaProps = z.infer<
  typeof exchangePublicTokenPropSchema
>;

/**
 * Exchanges a Plaid public token for an access token and performs necessary backend operations.
 * 
 * This function is specifically designed for use in the Plaid integration flow. It performs two main tasks:
 * 1. Exchanges the public token for an access token using the Plaid API.
 * 2. Performs a token exchange with our own backend system.
 * 
 * @param {ExchangePublicTokenPropSchemaProps} props - The properties required for the token exchange.
 * @param {string} props.publicToken - The public token received from Plaid Link.
 * @param {string} props.institutionId - The ID of the financial institution.
 * @param {string} props.institutionName - The name of the financial institution.
 * @param {string} props.userId - The ID of the user initiating the token exchange.
 * 
 * @returns {Promise<{ accessToken: string, itemId: string, institutionId: string, institutionName: string }>} A promise that resolves to an object containing the Plaid access token and related information.
 * 
 * @throws {Error} Throws an error if input validation fails, token exchange with Plaid fails, or token exchange with the backend fails.
 * 
 * @example
 * const result = await exchangePublicToken({
 *   publicToken: 'public-sandbox-0000000-0000000',
 *   institutionId: 'ins_12345',
 *   institutionName: 'Chase',
 *   userId: 'user_12345'
 * });
 */
export const exchangePublicToken = async (props: ExchangePublicTokenPropSchemaProps) => {
  let accessToken, itemId, institutionIdValue, institutionNameValue;

  try {
    const validatedProps = exchangePublicTokenPropSchema.parse(props);
    const { publicToken, institutionId, institutionName, userId } = validatedProps;

    logger("Starting public token exchange", { institutionId, institutionName, userId });

    // Exchange the public token with Plaid
    const { data } = await engine.auth.plaid.exchange({ 
      token: publicToken,
    });

    const { access_token, item_id } = data;
    accessToken = access_token;
    itemId = item_id;
    institutionIdValue = institutionId;
    institutionNameValue = institutionName;

    logger("Plaid token exchange successful", { itemId: item_id, accessToken: access_token });

    // Perform the exchange with our own backend
    const backendClient = initializeBackendClient();
    
    // Define the request body
    const payload: PlaidSyncAccountFromAccessTokenRequest = {
      userId: userId,
      accessToken: access_token,
      institutionId: institutionId,
      institutionName: institutionName,
      profileType: FinancialUserProfileType.Business,
      itemId: item_id,
    };

    const request: PlaidSyncAccountFromAccessTokenOperationRequest = {
      plaidSyncAccountFromAccessTokenRequest: payload,
    };

    // Exchange the token with the backend
    const backendExchangeResponse = await backendClient
      .getFinancialServiceApi()
      .plaidSyncAccountFromAccessToken(request);

    if (!backendExchangeResponse || !backendExchangeResponse.success) {
      logger("Failed to exchange access token with backend for Plaid", { itemId: item_id, accessToken: access_token });
      throw new Error("Failed to exchange access token with backend for Plaid");
    }

    logger("Backend token exchange successful");

    return {
      accessToken: accessToken,
      itemId: itemId,
      institutionIdValue,
      institutionNameValue
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid input:", error.errors);
    }
    console.error("Error in exchangePublicToken:", error);
  }

  // We always return the object in order to not break the contract of the function
  // as this is critical for the account onboarding flow for our end users
  return {
    accessToken: accessToken,
    itemId: itemId,
    institutionIdValue,
    institutionNameValue
  };
};
