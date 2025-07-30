import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { updateInboxAccount } from "@midday/supabase/mutations";

type UpdateRefreshTokenParams = {
  accountId: string;
  refreshToken: string;
};

export async function updateRefreshToken(params: UpdateRefreshTokenParams) {
  const supabase = createClient();

  // Validate refresh token before encryption
  if (!params.refreshToken || typeof params.refreshToken !== "string") {
    console.error("Invalid refresh token provided for update");
    return;
  }

  try {
    await updateInboxAccount(supabase, {
      id: params.accountId,
      refreshToken: encrypt(params.refreshToken),
    });
  } catch (error) {
    console.error("Failed to update refresh token:", error);
    throw new Error("Failed to update refresh token");
  }
}

type UpdateAccessTokenParams = {
  accountId: string;
  accessToken: string;
  expiryDate: string;
};

export async function updateAccessToken(params: UpdateAccessTokenParams) {
  const supabase = createClient();

  // Validate access token before encryption
  if (!params.accessToken || typeof params.accessToken !== "string") {
    console.error("Invalid access token provided for update");
    return;
  }

  try {
    await updateInboxAccount(supabase, {
      id: params.accountId,
      accessToken: encrypt(params.accessToken),
      expiryDate: params.expiryDate,
    });
  } catch (error) {
    console.error("Failed to update access token:", error);
    throw new Error("Failed to update access token");
  }
}
