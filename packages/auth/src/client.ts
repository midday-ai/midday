"use client";
import { isLocalBackend } from "@midday/utils/backend";
import {
  emailOTPClient,
  jwtClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const createLocalClient = () =>
  createAuthClient({
    plugins: [emailOTPClient(), jwtClient(), twoFactorClient()],
  });

type AuthClient = ReturnType<typeof createLocalClient>;
let instance: AuthClient | undefined;
export const authClient = new Proxy({} as AuthClient, {
  get(_target, property) {
    if (!isLocalBackend())
      throw new Error("Local authentication is not selected");
    instance ??= createLocalClient();
    return Reflect.get(instance, property);
  },
});
