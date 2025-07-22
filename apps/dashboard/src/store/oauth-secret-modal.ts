import { create } from "zustand";

interface OAuthSecretModalState {
  isOpen: boolean;
  clientSecret?: string;
  applicationName?: string;
  setSecret: (secret: string, applicationName: string) => void;
  close: () => void;
}

export const useOAuthSecretModalStore = create<OAuthSecretModalState>()(
  (set) => ({
    isOpen: false,
    clientSecret: undefined,
    applicationName: undefined,
    setSecret: (secret, applicationName) =>
      set({
        isOpen: true,
        clientSecret: secret,
        applicationName,
      }),
    close: () =>
      set({
        isOpen: false,
        clientSecret: undefined,
        applicationName: undefined,
      }),
  }),
);
