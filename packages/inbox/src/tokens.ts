import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { updateInboxAccount } from "@midday/supabase/mutations";

type UpdateRefreshTokenParams = {
  accountId: string;
  refreshToken: string;
};

export async function updateRefreshToken(params: UpdateRefreshTokenParams) {
  const supabase = createClient();

  await updateInboxAccount(supabase, {
    id: params.accountId,
    refreshToken: encrypt(params.refreshToken),
  });
}

type UpdateAccessTokenParams = {
  accountId: string;
  accessToken: string;
  expiryDate: string;
};

export async function updateAccessToken(params: UpdateAccessTokenParams) {
  const supabase = createClient();

  await updateInboxAccount(supabase, {
    id: params.accountId,
    accessToken: encrypt(params.accessToken),
    expiryDate: params.expiryDate,
  });
}
