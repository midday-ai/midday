"use server";

import { engine } from "@/utils/engine";
import { z } from "zod";
import { exchangeAccessTokenWithBackend } from "../solomon-backend/access-token/exchange-access-token-action";


export const exchangePublicTokenPropSchema = z.object({
  publicToken: z.string().min(1),
  institutionId: z.string().min(1),
  institutionName: z.string().min(1),
  userId: z.string().min(1),
});

export type ExchangePublicTokenPropSchemaProps = z.infer<
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
 * @returns {Promise<string>} A promise that resolves to the Plaid access token.
 * 
 * @throws {Error} Throws an error if the token exchange with the backend fails.
 * 
 * @example
 * const accessToken = await exchangePublicToken({
 *   publicToken: 'public-sandbox-0000000-0000000',
 *   institutionId: 'ins_12345',
 *   institutionName: 'Chase',
 *   userId: 'user_12345'
 * });
 */
export const exchangePublicToken = async (props: ExchangePublicTokenPropSchemaProps) => {
  const { publicToken, institutionId, institutionName, userId } = props;

  // exchange the backend token
  const { data } = await engine.auth.plaid.exchange({ 
    token: publicToken,
   });

  // perform the exchange also with out own backend
  const res = await exchangeAccessTokenWithBackend({
    publicToken,
    institutionId,
    institutionName,
    userId,
  });

  if (!res || res.success) {
    console.error("Failed to exchange access token with backend for Plaid", {
      response: res,
    });
  }

  return data.access_token;
};
