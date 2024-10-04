"use client";

import { initializeBackendClient } from "@/utils/backend";
import { useEffect } from "react";

/**
 * BackendClientInitializer Component
 * 
 * This component initializes the SingletonHttpClient with the backend URL
 * on the client-side. It uses the dashboard environment to get the correct URL.
 * 
 * @returns {null} This component doesn't render anything visible
 */
export function BackendClientInitializer(): null {
    useEffect(() => {
        initializeBackendClient();
    }, []);

    return null;
}