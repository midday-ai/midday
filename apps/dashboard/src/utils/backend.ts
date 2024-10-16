import { ERROR_TYPE } from "@/types/error-types";
import { FetchUserResponse } from "@/types/fetch-types";
import { BackendClient, SingletonHttpClient } from "@internal/backend-client/client";
import { dashboardEnvironment as env } from "@internal/env/dashboard";

/**
 * Initializes and returns the backend client with enhanced configuration.
 * @returns The initialized BackendClient instance.
 * @throws Error if the backend URL is not configured properly.
 */
function initializeBackendClient(apiKey?: string): BackendClient {
    const backendUrl = env.NEXT_PUBLIC_SOLOMON_AI_BACKEND_PLATFORM_API_URL;

    if (!backendUrl) {
        throw new Error("Backend URL is not configured. Please check your environment variables.");
    }

    if (!apiKey) {
        console.warn("API key is not set. Some features may not work correctly.");
    }

    // Initialize the client with the API key and backend URL
    SingletonHttpClient.initialize(apiKey || "", backendUrl);

    // Configure additional options if needed
    const client = SingletonHttpClient.getInstance();

    return client;
}

function getBackendClient(): BackendClient {
    return  initializeBackendClient();
}

function createErrorResponse(type: ERROR_TYPE, message: string): FetchUserResponse {
    return {
        authenticated: false,
        userExists: false,
        error: message,
        type,
    };
}

export { createErrorResponse, getBackendClient, initializeBackendClient };

