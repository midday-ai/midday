import { initializeBackendClient } from "@/utils/backend";
import { LogEvents } from "@midday/events/events";
import {
    FinancialUserProfileType,
    PlaidExchangeTokenOperationRequest,
    PlaidExchangeTokenRequest,
} from "client-typescript-sdk";
import { z } from "zod";
import { authActionClient } from "../../safe-action";

export const exchangeAccessTokenWithBackendSchema = z.object({
    publicToken: z.string().min(1),
    institutionId: z.string().min(1),
    institutionName: z.string().min(1),
    userId: z.string().min(1),
});

export type ExchangeAccessTokenWithBackendFormValues = z.infer<
    typeof exchangeAccessTokenWithBackendSchema
>;

/**
 * Exchanges a Plaid public token for an access token using the backend service.
 * 
 * @param {Object} options - The options for the action.
 * @param {Object} options.parsedInput - The parsed input data.
 * @param {string} options.parsedInput.publicToken - The Plaid public token to be exchanged.
 * @param {string} options.parsedInput.institutionId - The ID of the financial institution.
 * @param {string} options.parsedInput.institutionName - The name of the financial institution.
 * @param {string} options.parsedInput.userId - The ID of the user initiating the token exchange.
 * @param {Object} options.ctx - The context object.
 * @param {Object} options.ctx.supabase - The Supabase client instance.
 * 
 * @returns {Promise<Object>} The response from the backend after exchanging the token.
 * @throws {Error} If the token exchange fails.
 */
export const exchangeAccessTokenWithBackend = authActionClient.
    schema(exchangeAccessTokenWithBackendSchema).
    metadata({
        name: "exchange-access-token-with-backend",
        track: {
            event: LogEvents.ExchangeAccessTokenWithBackend.name,
            channel: LogEvents.ExchangeAccessTokenWithBackend.channel,
        },
    }).action(async ({
        parsedInput: { publicToken, institutionId, institutionName, userId },
        ctx: { supabase },
    }) => {
        const backendClient = await initializeBackendClient();

        // Define the request body
        const requestBody: PlaidExchangeTokenRequest = {
            userId: userId,
            publicToken: publicToken,
            institutionId: institutionId,
            institutionName: institutionName,
            profileType: FinancialUserProfileType.Business,
        };

        const request: PlaidExchangeTokenOperationRequest = {
            plaidExchangeTokenRequest: requestBody,
        };

        // Exchange the token with the backend
        const response = await backendClient
            .getFinancialServiceApi()
            .plaidExchangeToken(request);

        if (!response) {
            throw new Error("Token could not be exchanged");
        }

        return response;
    });