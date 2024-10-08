"use server";

import { initializeBackendClient } from "@/utils/backend";
import { LogEvents } from "@midday/events/events";
import { getSession } from "@midday/supabase/cached-queries";
import {
    CreateUserV2OperationRequest,
    CreateUserV2Request,
    ProfileType,
} from "@solomon-ai/client-typescript-sdk";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "../safe-action";


export const onboardAccountToBackendSchema = z.object({
    username: z
        .string()
        .min(10, { message: "Username must be at least 10 characters long" })
        .max(20, { message: "Username cannot exceed 20 characters" })
        .regex(/^[a-zA-Z0-9_]+$/, {
            message: "Username can only contain letters, numbers, and underscores",
        }),
    redirectTo: z.string().optional(),
});

export type OnboardAccountToBackendSchemaFormValues = z.infer<
    typeof onboardAccountToBackendSchema
>;

/**
 * Action to connect a user account with the platform backend.
 * This action creates a user record in the Solomon platform backend using the authenticated user's information.
 *
 * @param {Object} params - The parameters for the action.
 * @param {string} params.username - The username for the new user account.
 * @returns {Promise<CreateUserV2OperationResponse>} The response from the user creation operation.
 * @throws {Error} If the user is not found, not authenticated, or if required user data is missing.
 */

export const onboardAccountToBackendAction = authActionClient.
    schema(onboardAccountToBackendSchema).
    metadata({
        name: "onboard-account-to-backend",
        track: {
            event: LogEvents.OnboardAccountToBackend.name,
            channel: LogEvents.OnboardAccountToBackend.channel,
        },
    }).action(
        async ({
            parsedInput: { username, redirectTo },
            ctx: { supabase },
        }) => {
            const {
                data: { session },
            } = await getSession();
            const user = session?.user;

            if (!user) {
                throw new Error("User is not authenticated");
            }

            // Validate the provided data payload
            if (!user.email) {
                throw new Error("User email is missing");
            }

            if (!user?.id) {
                throw new Error("User id is missing");
            }

            if (!user?.user_metadata.picture) {
                throw new Error("User avatar url is missing");
            }

            // we initialize the backend client here
            const backendClient = initializeBackendClient();

            /**
             * Define the create user request
             * @type {CreateUserV2Request}
             */
            const requestBody: CreateUserV2Request = {
                email: user.email,
                username: username,
                profileType: ProfileType.Business,
                profileImageUrl: user?.user_metadata.picture ?? "",
                supabaseAuthUserId: user.id,
            };

            /**
             * Prepare the operation request
             * @type {CreateUserV2OperationRequest}
             */
            const req: CreateUserV2OperationRequest = {
                createUserV2Request: requestBody,
            };

            // Send the create user request to the backend
            const createUserResponse = await backendClient
                .getUserServiceV2Api()
                .createUserV2(req);

            if (!createUserResponse) {
                throw new Error("User could not be created");
            }

            revalidateTag(`user_${user.id}`);
            revalidateTag(`teams_${user.id}`);

            if (redirectTo) {
                redirect(redirectTo);
            }

            
            return createUserResponse;
        },
    );
