import "server-only";
import { isLocalBackend } from "@midday/utils/backend";
import type { auth } from "./local-server";
export type Auth = typeof auth;
let instance: Promise<Auth> | undefined;
export function getAuth(): Promise<Auth> {
  if (!isLocalBackend())
    throw new Error("Local authentication is not selected");
  instance ??= import("./local-server").then((module) => module.auth);
  return instance;
}
