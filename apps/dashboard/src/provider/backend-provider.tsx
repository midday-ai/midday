"use client";

import LoadingUserDataFromBackend from "@/components/loading-user-data-from-backend";
import features from "@/config/enabled-features";
import { USER_STORE_KEY, UserState, useUserStore } from "@/store/backend";
import { useToast } from "@midday/ui/use-toast";
import React, { useCallback, useEffect, useState } from "react";

/**
 * Props for the StoreProvider component.
 * @extends React.PropsWithChildren
 */
interface StoreProviderProps extends React.PropsWithChildren {
    /** The unique identifier of the user */
    userId: string;
    /** The access token for authentication */
    accessToken: string;
    /** The email address of the user */
    email: string;
}

/**
 * StoreProvider component that manages user data and authentication state.
 * It fetches user profile data from the backend and initializes the user store.
 *
 * @param {StoreProviderProps} props - The component props
 * @returns {React.ReactElement} The rendered component
 */
const StoreProvider: React.FC<StoreProviderProps> = ({
    children,
    userId,
    email,
    accessToken,
}) => {
    const { toast } = useToast();
    const { setData, reset } = useUserStore();
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetches the user profile from the backend.
     * 
     * @returns {Promise<UserState | null>} The user data if successful, null otherwise
     */
    const fetchUserProfile = useCallback(async () => {
        try {
            const { queryUserProfileFromBackend } = await import("@/actions-queries/query-user-from-backend");
            const response = await queryUserProfileFromBackend({ userId, email, accessToken });

            if ('error' in response) {
                throw new Error(response.error);
            }

            return { ...response, authenticated: true };
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast({
                title: "Error fetching user data",
                description: "Please try again later",
                variant: "destructive",
            });
            return null;
        }
    }, [userId, email, accessToken, toast]);

    /**
     * Initializes the user store with data from local storage or by fetching from the backend.
     */
    const initializeStore = useCallback(async () => {
        const storedState = getStoredState();
        if (storedState?.authenticated && storedState.userId === userId) {
            setData({
                ...storedState,
                supabaseAuth0UserId: userId,
            });
            return;
        }

        if (userId && email && accessToken) {
            const userData = await fetchUserProfile();
            if (userData) {
                setData({
                    ...userData,
                    supabaseAuth0UserId: userId,
                });
                localStorage.setItem(USER_STORE_KEY, JSON.stringify(userData));
            } else {
                reset();
            }
        } else {
            reset();
        }
    }, [userId, email, accessToken, setData, reset, fetchUserProfile]);

    /**
     * Effect hook to initialize user data when the component mounts.
     */
    useEffect(() => {
        const initializeData = async () => {
            if (features.isBackendEnabled) {
                try {
                    await initializeStore();
                } catch (error) {
                    console.error("Error initializing store:", error);
                    toast({
                        title: "Error initializing user data",
                        description: "Please try refreshing the page",
                        variant: "destructive",
                    });
                }
            }
            setIsLoading(false);
        };

        initializeData();
    }, [initializeStore, toast]);

    if (isLoading) {
        return <LoadingUserDataFromBackend />;
    }

    return <>{children}</>;
};

/**
 * Retrieves the stored user state from local storage.
 * 
 * @returns {UserState | null} The parsed user state if available, null otherwise
 */
function getStoredState(): UserState | null {
    if (typeof window === "undefined") return null;
    const storedState = localStorage.getItem(USER_STORE_KEY);
    try {
        return storedState ? JSON.parse(storedState) : null;
    } catch (error) {
        console.error("Error parsing stored state:", error);
        return null;
    }
}

export default StoreProvider;