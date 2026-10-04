import "server-only";
import { getAuth } from "@midday/auth/server";
import { createClient } from "@midday/supabase/server";
import { isLocalBackend } from "@midday/utils/backend";
import { headers } from "next/headers";
import { cache } from "react";

async function readSession(fresh = false) {
  if (isLocalBackend())
    return (await getAuth()).api.getSession({
      headers: await headers(),
      query: { disableCookieCache: fresh },
    });
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? "",
      image: user.user_metadata?.avatar_url ?? null,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at ?? user.created_at),
      emailVerified: !!user.email_confirmed_at,
      twoFactorEnabled:
        user.factors?.some((factor) => factor.status === "verified") ?? false,
    },
    session: {
      id: user.id,
      userId: user.id,
      token: session.access_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000),
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at ?? user.created_at),
      aal: "aal1",
    },
  };
}
export const getSession = cache(() => readSession());
export const getFreshSession = () => readSession(true);
export const getApiToken = cache(async () => {
  if (!isLocalBackend())
    return (
      (await (await createClient()).auth.getSession()).data.session
        ?.access_token ?? null
    );
  if (!(await getSession())) return null;
  return (
    (await (await getAuth()).api.getToken({ headers: await headers() }))
      ?.token ?? null
  );
});
export async function signOut() {
  if (!isLocalBackend()) {
    await (await createClient()).auth.signOut();
    return;
  }
  await (await getAuth()).api.signOut({ headers: await headers() });
}
