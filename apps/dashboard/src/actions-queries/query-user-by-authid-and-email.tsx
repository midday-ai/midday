"use server";

import { ERROR_TYPE } from "@/types/error-types";
import { FetchUserResponse } from "@/types/fetch-types";
import { createErrorResponse, initializeBackendClient } from "@/utils/backend";
import { getSession } from "@midday/supabase/cached-queries";
import {
    CheckEmailAndAuth0UserIdExistsRequest
} from "@solomon-ai/client-typescript-sdk";


/**
 * Fetches user information by Auth0 ID and email.
 *
 * This server-side function attempts to retrieve user information based on the provided
 * Auth0 ID and email. It performs the following steps:
 * 1. Checks for an active user session.
 * 2. Queries the backend service to verify if a user with the given Auth0 ID and email exists.
 * 3. Returns the user information if found, or an appropriate error response.
 *
 * @param {CheckEmailAndAuth0UserIdExistsRequest} request - An object containing the Auth0 ID and email to check.
 * @returns {Promise<FetchUserResponse>} A promise that resolves to an object containing:
 *   - authenticated: Boolean indicating if the user is authenticated.
 *   - userExists: Boolean indicating if the user exists in the system.
 *   - userAccount: User account information if found.
 *   - error: Error information if an error occurred during the process.
 *
 * @throws Will not throw errors directly, but will return error responses in the FetchUserResponse object.
 *
 * @example
 * const result = await fetchUserByAuth0IdAndEmail({
 *   auth0UserId: 'auth0|123456789',
 *   email: 'user@example.com'
 * });
 * if (result.authenticated && result.userExists) {
 *   console.log('User found:', result.userAccount);
 * } else if (result.error) {
 *   console.error('Error:', result.error);
 * }
 */
export async function fetchUserByAuth0IdAndEmail(
    request: CheckEmailAndAuth0UserIdExistsRequest,
): Promise<FetchUserResponse> {
    try {
        const session = await getSession();
        if (!session?.data.session) {
            return createErrorResponse(
                ERROR_TYPE.USER_NOT_AUTHENTICATED,
                "No active session found"
            );
        }

        const backendClient = initializeBackendClient();
        const response = await backendClient.userServiceApi.checkEmailAndAuth0UserIdExists(request);

        if (!response._exists) {
            return createErrorResponse(
                ERROR_TYPE.USER_DOES_NOT_EXIST,
                "User does not exist"
            );
        }

        return {
            authenticated: true,
            userExists: true,
            userAccount: response,
        };
    } catch (error) {
        console.error("Error in fetchUserByAuth0IdAndEmail:", error);
        return createErrorResponse(
            ERROR_TYPE.USER_NOT_FOUND,
            "An unexpected error occurred while fetching user information"
        );
    }
}

