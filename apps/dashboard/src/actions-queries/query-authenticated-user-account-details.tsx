"use server";

import { APIRequestError } from "@/types/error-types";
import { FetchUserAccountDetailsResponse } from "@/types/fetch-types";
import { initializeBackendClient } from "@/utils/backend";
import { getSession } from "@midday/supabase/cached-queries";
import {
    GetUserProfile1ProfileTypeEnum,
    GetUserProfile1Request,
    GetUserV2ProfileTypeEnum,
    GetUserV2Request
} from "@solomon-ai/client-typescript-sdk";

/**
 * Fetches authenticated user account details including financial profile.
 * 
 * @param request - The request object for fetching user details.
 * @returns A promise that resolves to the user account details, financial profile, and financial context.
 * @throws {APIRequestError} If there's no active session, invalid account details, or no financial profile found.
 * 
 * @remarks
 * This function performs the following steps:
 * 1. Checks for an active user session.
 * 2. Initializes the backend client.
 * 3. Fetches user data using the provided request.
 * 4. Retrieves the financial profile for the user.
 * 5. Returns the combined account details, financial profile, and context.
 * 
 * @example
 * ```typescript
 * const request: GetUserV2Request = { profileType: GetUserV2ProfileTypeEnum.User };
 * const userDetails = await queryAuthenticatedUserAccountDetails(request);
 * ```
 */
export async function queryAuthenticatedUserAccountDetails(
    request: GetUserV2Request
): Promise<FetchUserAccountDetailsResponse> {
    try {
        const session = await getSession();
        if (!session?.data.session) {
            throw new APIRequestError("No active session found");
        }

        const backendClient = initializeBackendClient();

        // Fetch user data
        const userResponse = await backendClient.userServiceApi.getUserV2(request);
        const account = userResponse.userAccount || userResponse.businessAccount;


        if (!account?.supabaseAuth0UserId) {
            throw new APIRequestError("Invalid account details or missing Supabase Auth User ID");
        }

        // Prepare and fetch financial profile
        const financialProfileRequest: GetUserProfile1Request = {
            userId: account.supabaseAuth0UserId,
            profileType: request.profileType === GetUserV2ProfileTypeEnum.User
                ? GetUserProfile1ProfileTypeEnum.User
                : GetUserProfile1ProfileTypeEnum.Business,
            bypassCache: true
        };

        const { profile: financialProfile, financialContext } = 
            await backendClient.financialServiceApi.getUserProfile1(financialProfileRequest);
        

        if (!financialProfile) {
            throw new APIRequestError("No financial profile found");
        }

        return { account, financialProfile, financialContext };
    } catch (error) {
        console.error("Error in queryAuthenticatedUserAccountDetails:", error);
        throw error instanceof APIRequestError 
            ? error 
            : new APIRequestError("An unexpected error occurred while fetching user account details");
    }
}