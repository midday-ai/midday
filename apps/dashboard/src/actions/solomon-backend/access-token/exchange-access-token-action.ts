import { initializeBackendClient } from "@/utils/backend";
import { LogEvents } from "@midday/events/events";
import {
    FinancialUserProfileType,
    PlaidExchangeTokenOperationRequest,
    PlaidExchangeTokenRequest,
} from "@solomon-ai/client-typescript-sdk";
import { z } from "zod";
import { authActionClient } from "../../safe-action";

/**
 * Zod schema for validating the input for exchanging access tokens with the backend.
 * @property {string} publicToken - The Plaid public token to be exchanged. Must be non-empty.
 * @property {string} institutionId - The ID of the financial institution. Must be non-empty.
 * @property {string} institutionName - The name of the financial institution. Must be non-empty.
 * @property {string} userId - The ID of the user initiating the token exchange. Must be non-empty.
 */
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
 * This action is authenticated and tracks the event using LogEvents.
 * 
 * @param {Object} options - The options for the action.
 * @param {Object} options.parsedInput - The parsed and validated input data.
 * @param {string} options.parsedInput.publicToken - The Plaid public token to be exchanged.
 * @param {string} options.parsedInput.institutionId - The ID of the financial institution.
 * @param {string} options.parsedInput.institutionName - The name of the financial institution.
 * @param {string} options.parsedInput.userId - The ID of the user initiating the token exchange.
 * @param {Object} options.ctx - The context object containing additional information.
 * @param {Object} options.ctx.supabase - The Supabase client instance for database operations.
 * 
 * @returns {Promise<Object>} A promise that resolves to the response from the backend after exchanging the token.
 * @throws {Error} If the token exchange fails or the response is empty.
 */
export const exchangeAccessTokenWithBackendAction = authActionClient.
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

/**
 * Exchanges a Plaid public token for an access token using the backend service.
 * This function is a standalone version of the token exchange process, not wrapped in an action.
 * 
 * @param {ExchangeAccessTokenWithBackendFormValues} props - The properties required for token exchange.
 * @param {string} props.publicToken - The Plaid public token to be exchanged.
 * @param {string} props.institutionId - The ID of the financial institution.
 * @param {string} props.institutionName - The name of the financial institution.
 * @param {string} props.userId - The ID of the user initiating the token exchange.
 * 
 * @returns {Promise<Object>} A promise that resolves to the response from the backend after exchanging the token.
 * @throws {Error} If the token exchange fails or the response is empty.
 */
export const exchangeAccessTokenWithBackend = async (
    props: ExchangeAccessTokenWithBackendFormValues
) => {
    const { publicToken, institutionId, institutionName, userId } = props;
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
};