"use server";

import { ERROR_TYPE } from "@/types/error-types";
import { FetchDataProps, FetchDataResponse } from "@/types/fetch-types";
import {
    CheckEmailAndAuth0UserIdExistsRequest,
    CheckEmailAndAuth0UserIdExistsResponse, GetUserV2Request, ProfileType
} from "client-typescript-sdk";
import { queryAuthenticatedUserAccountDetails } from "./query-authenticated-user-account-details";
import { fetchUserByAuth0IdAndEmail } from "./query-user-by-authid-and-email";

/**
 * Queries the user profile from the backend and authenticates the user.
 * 
 * @param {FetchDataProps} options - The options for fetching user data.
 * @param {string} [options.userId] - The Auth0 user ID.
 * @param {string} [options.email] - The user's email address.
 * @param {string} [options.accessToken] - The access token for authentication.
 * @param {boolean} [options.isAuthenticated=false] - Flag indicating if the user is already authenticated.
 * 
 * @returns {Promise<FetchDataResponse>} A promise that resolves to the fetch data response.
 * 
 * @throws {Error} If there's an error during the authentication process.
 * 
 * @description
 * This function performs the following steps:
 * 1. Checks if the user is already authenticated.
 * 2. Validates the input parameters.
 * 3. Fetches the user by Auth0 ID and email.
 * 4. Determines the profile type (Business or User).
 * 5. Authenticates the user and retrieves account details.
 * 6. Returns the authenticated user data or an error response.
 * 
 * @example
 * const result = await queryUserProfileFromBackend({
 *   userId: 'auth0|123456',
 *   email: 'user@example.com',
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   isAuthenticated: false
 * });
 */
export async function queryUserProfileFromBackend({
    userId,
    email,
    accessToken,
    isAuthenticated = false,
}: FetchDataProps): Promise<FetchDataResponse> {
    if (isAuthenticated) {
        return { authenticated: true };
    }

    if (!email && !userId) {
        return {
            authenticated: false,
            error: "Invalid provider request",
            type: ERROR_TYPE.INVALID_REQUEST,
        };
    }

    try {
        const req: CheckEmailAndAuth0UserIdExistsRequest = {
            email,
            supabaseAuth0UserId: userId,
        };

        const response = await fetchUserByAuth0IdAndEmail(req);

        if (!response || !response.authenticated || !response.userExists) {
            return {
                authenticated: false,
                error: "User does not exist",
                type: ERROR_TYPE.USER_DOES_NOT_EXIST,
            };
        }

        const { businessAccount, userAccount } =
            response.userAccount as CheckEmailAndAuth0UserIdExistsResponse;

        const profileType = businessAccount
            ? ProfileType.Business
            : ProfileType.User;
        const accountId = businessAccount?.id || userAccount?.id;

        if (!accountId) {
            return {
                authenticated: false,
                error: "Invalid account ID",
                type: ERROR_TYPE.INVALID_REQUEST,
            };
        }

        const authenticateRequest: GetUserV2Request = {
            userId: accountId,
            profileType,
        };

        const authenticateResponse = await queryAuthenticatedUserAccountDetails(authenticateRequest);

        if (!authenticateResponse) {
            return {
                authenticated: false,
                error: "An error occurred while authenticating the user",
                type: ERROR_TYPE.USER_NOT_AUTHENTICATED,
            };
        }

        return {
            authenticated: true,
            userFinancialProfile: authenticateResponse.financialProfile,
            userFinancialContext: authenticateResponse.financialContext,
            userAccount: authenticateResponse.account,
            token: accessToken,
            userId: accountId,
        };
    } catch (error) {
        console.error("Error in fetchUserProfileFromBackend:", error);
        return {
            authenticated: false,
            error: `An error occurred while authenticating the user: ${error}`,
            type: ERROR_TYPE.USER_NOT_AUTHENTICATED,
        };
    }
}