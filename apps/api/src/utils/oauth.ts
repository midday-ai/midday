import { safeCompare } from "@api/utils/safe-compare";
import { hash } from "@midday/encryption";

export type OAuthApplication = {
  id: string;
  active: boolean | null;
  clientSecret: string | null;
};

export function validateClientCredentials(
  application: OAuthApplication | null | undefined,
  clientSecret: string,
): boolean {
  if (!application?.active) {
    return false;
  }

  if (!application.clientSecret) {
    return false;
  }

  const hashedSecret = hash(clientSecret);
  const storedSecret = application.clientSecret;

  // Use timing-safe comparison to prevent timing attacks
  return safeCompare(storedSecret, hashedSecret);
}
