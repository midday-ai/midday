import {
    FinancialUserProfile,
    type BusinessAccount,
    type MelodyFinancialContext,
    type UserAccount,
} from "client-typescript-sdk";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Represents the properties of the user state.
 */
export interface UserStateProps {
    /** Indicates whether the user is authenticated. */
    authenticated: boolean;
    /** The unique identifier of the user. */
    userId: string;
    /** The unique identifier of the user in Auth0. */
    supabaseAuth0UserId: string;
    /** The user's account information, which can be either a UserAccount or BusinessAccount. */
    userAccount: UserAccount | BusinessAccount;
    /** The financial profile of the user. */
    userFinancialProfile: FinancialUserProfile;
    /** The financial context of the user within the Melody system. */
    userFinancialContext: MelodyFinancialContext;
    /** The authentication token for the user. */
    token: string;
    isOpen: boolean;
}

/**
 * Extends UserStateProps with methods to update the state.
 */
export interface UserState extends UserStateProps {
    /** Sets the authenticated status of the user. */
    setAuthenticated: (authenticated: boolean) => void;
    /** Sets the user ID. */
    setUserId: (userId: string) => void;
    /** Sets the user account information. */
    setUserAccount: (userAccount: UserAccount | BusinessAccount) => void;
    /** Sets the user's financial profile. */
    setUserFinancialProfile: (userFinancialProfile: FinancialUserProfile) => void;
    /** Sets the user's financial context. */
    setUserFinancialContext: (userFinancialContext: MelodyFinancialContext) => void;
    /** Sets the authentication token. */
    setToken: (token: string) => void;
    /** Resets the state to its initial values. */
    reset: () => void;
    /** Updates multiple state properties at once. */
    setData: (data: Partial<UserStateProps>) => void;
    setOpen: (isOpen: boolean) => void;
}

/**
 * The initial state of the user store.
 */
const initialState: UserStateProps = {
    authenticated: false,
    userId: "",
    supabaseAuth0UserId: "",
    userAccount: {} as UserAccount | BusinessAccount,
    userFinancialProfile: {} as FinancialUserProfile,
    userFinancialContext: {} as MelodyFinancialContext,
    token: "",
    isOpen: false,
};

/** The key used to persist the user store in storage. */
export const USER_STORE_KEY = "userStore";

/**
 * Creates and exports the user store with persistence.
 * 
 * This store manages user-related state, including authentication status,
 * user information, and financial data. It uses Zustand for state management
 * and includes persistence to sessionStorage.
 * 
 * @returns A Zustand store with methods to get and update user state.
 */
export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            ...initialState,
            setAuthenticated: (authenticated: boolean) => set({ authenticated }),
            setUserId: (userId: string) => set({ userId }),
            setUserAccount: (userAccount: UserAccount | BusinessAccount) => set({ userAccount }),
            setUserFinancialProfile: (userFinancialProfile: FinancialUserProfile) => set({ userFinancialProfile }),
            setUserFinancialContext: (userFinancialContext: MelodyFinancialContext) => set({ userFinancialContext }),
            setToken: (token: string) => set({ token }),
            setData: (data: Partial<UserStateProps>) => set(data),
            setSupabaseAuth0UserId: (supabaseAuth0UserId: string) => set({ supabaseAuth0UserId }),
            reset: () => set(initialState),
            setOpen: (isOpen: boolean) => set({ isOpen }),
        }),
        {
            name: USER_STORE_KEY,
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);