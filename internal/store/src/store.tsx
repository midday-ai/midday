import {
  FinancialUserProfile,
  type BusinessAccount,
  type MelodyFinancialContext,
  type UserAccount,
} from "client-typescript-sdk";
import { createStore } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export interface UserStateProps {
  authenticated: boolean;
  userId: string;
  userAccount: UserAccount | BusinessAccount;
  userFinancialProfile: FinancialUserProfile;
  userFinancialContext: MelodyFinancialContext;
  token: string;
}

export interface UserState extends UserStateProps {
  setAuthenticated: (authenticated: boolean) => void;
  setUserId: (userId: string) => void;
  setUserAccount: (userAccount: UserAccount | BusinessAccount) => void;
  setUserFinancialProfile: (userFinancialProfile: FinancialUserProfile) => void;
  setUserFinancialContext: (
    userFinancialContext: MelodyFinancialContext,
  ) => void;
  setToken: (token: string) => void;
  reset: () => void;
  setData: (data: Partial<UserStateProps>) => void;
}

const initialState: UserStateProps = {
  authenticated: false,
  userId: "",
  userAccount: {},
  userFinancialProfile: {},
  userFinancialContext: {},
  token: "",
};

export const USER_STORE_KEY = "userStore";

export const useUserStore = (initProps?: Partial<UserStateProps>) => {
  const DEFAULT_PROPS: UserStateProps = {
    ...initialState,
  };
  return createStore<UserState>()(
    persist(
      (set) => ({
        ...DEFAULT_PROPS,
        ...initProps,
        setAuthenticated: (authenticated: boolean) => {
          set({ authenticated });
        },
        setUserId: (userId: string) => {
          set({ userId });
        },
        setUserAccount: (userAccount: UserAccount | BusinessAccount) => {
          set({ userAccount });
        },
        setUserFinancialProfile: (
          userFinancialProfile: FinancialUserProfile,
        ) => {
          set({ userFinancialProfile });
        },
        setUserFinancialContext: (
          userFinancialContext: MelodyFinancialContext,
        ) => {
          set({ userFinancialContext });
        },
        setToken: (token: string) => {
          set({ token });
        },
        setData: (data: Partial<UserStateProps>) => {
          set({ ...data });
        },
        reset: () => {
          set({ ...initialState });
        },
      }),
      {
        name: USER_STORE_KEY,
        storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      },
    ),
  );
};
