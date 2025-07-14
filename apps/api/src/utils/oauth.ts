import { timingSafeEqual } from "node:crypto";
import { hash } from "@midday/encryption";

export type OAuthApplication = {
  id: string;
  active: boolean | null;
  clientSecret: string;
};

export function validateClientCredentials(
  application: OAuthApplication | null | undefined,
  clientSecret: string,
): boolean {
  if (!application || !application.active) {
    return false;
  }

  const hashedSecret = hash(clientSecret);
  const storedSecret = application.clientSecret;

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(Buffer.from(storedSecret), Buffer.from(hashedSecret));
}
