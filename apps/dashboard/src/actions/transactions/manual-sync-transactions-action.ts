"use server";

import { authActionClient } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { initializeBackendClient } from "@/utils/backend";
import { logger } from "@/utils/logger";
import { LogEvents } from "@midday/events/events";
import { Events, client } from "@midday/jobs";
import {
  FinancialUserProfileType,
  PlaidSyncAccountFromAccessTokenOperationRequest,
  PlaidSyncAccountFromAccessTokenRequest,
} from "@solomon-ai/client-typescript-sdk";

export const manualSyncTransactionsAction = authActionClient
  .schema(manualSyncTransactionsSchema)
  .metadata({
    name: "manual-sync-transactions",
    track: {
      event: LogEvents.TransactionsManualSync.name,
      channel: LogEvents.TransactionsManualSync.channel,
    },
  } as any)
  .action(
    async ({
      parsedInput: {
        connectionId,
        userId,
        accessToken,
        institutionId,
        institutionName,
        itemId,
      },
      ctx: { user },
    }) => {
      const event = await client.sendEvent({
        name: Events.TRANSACTIONS_MANUAL_SYNC,
        payload: {
          connectionId,
          teamId: user.team_id,
        },
      });

      // Perform the exchange with our own backend
      const backendClient = initializeBackendClient();

      // Define the request body
      const payload: PlaidSyncAccountFromAccessTokenRequest = {
        userId: userId,
        accessToken: accessToken,
        institutionId: institutionId,
        institutionName: institutionName,
        profileType: FinancialUserProfileType.Business,
        itemId: itemId,
      };

      const request: PlaidSyncAccountFromAccessTokenOperationRequest = {
        plaidSyncAccountFromAccessTokenRequest: payload,
      };

      console.log("request as defined for plaid sync operation", {
        request,
      });

      // Exchange the token with the backend
      const backendExchangeResponse = await backendClient
        .getFinancialServiceApi()
        .plaidSyncAccountFromAccessToken(request);

      console.log("Backend token exchange successful", {
        backendExchangeResponse,
      });

      if (!backendExchangeResponse || !backendExchangeResponse.success) {
        logger("Failed to exchange access token with backend for Plaid", {
          itemId: itemId,
          accessToken: accessToken,
        });
        // throw new Error("Failed to exchange access token with backend for Plaid");
      }

      return event;
    },
  );
