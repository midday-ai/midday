"use server";

import { initializeBackendClient } from "@/utils/backend";
import { LogEvents } from "@midday/events/events";
import {
    FinancialUserProfileType,
    PlaidSyncAccountFromAccessTokenOperationRequest,
    PlaidSyncAccountFromAccessTokenRequest,
} from "client-typescript-sdk";
import { z } from "zod";
import { authActionClient } from "../../safe-action";


export const syncAccountFromAccessTokenSchema = z.object({
  accessToken: z.string().min(1),
  institutionId: z.string().min(1),
  institutionName: z.string().min(1),
  userId: z.string().min(1),
  profileType: z.nativeEnum(FinancialUserProfileType),
  itemId: z.string().min(1),
});

export type SyncAccountFromAccessTokenFormValues = z.infer<
  typeof syncAccountFromAccessTokenSchema
>;


export const syncAccountDetailsFromAccessToken = authActionClient.
    schema(syncAccountFromAccessTokenSchema).
    metadata({
        name: "sync-account-details-from-access-token",
        track: {
            event: LogEvents.SyncAccountDetailsFromAccessToken.name,
            channel: LogEvents.SyncAccountDetailsFromAccessToken.channel,
        },
    }).action(async ({
        parsedInput: { accessToken, userId, institutionId, institutionName, profileType, itemId },
        ctx: { supabase },
    }) => {
        const backendClient = initializeBackendClient();
        // Define the request body
        const requestBody: PlaidSyncAccountFromAccessTokenRequest = {
            userId: userId,
            accessToken: accessToken,
            institutionId: institutionId,
            institutionName: institutionName,
            profileType: profileType,
            itemId: itemId,
        };

        const request: PlaidSyncAccountFromAccessTokenOperationRequest = {
            plaidSyncAccountFromAccessTokenRequest: requestBody,
        };

        // Exchange the token with the backend
        const response = await backendClient
            .getFinancialServiceApi()
            .plaidSyncAccountFromAccessToken(request);

        if (!response) {
            throw new Error("Token could not be exchanged");
        }

        return response;
    });