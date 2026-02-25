import { getLocationHeaders } from "@midday/location";
import { createClient } from "@midday/supabase/server";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { Cookies } from "@/utils/constants";
import { getRequestTraceHeaders } from "@/utils/request-trace";

const getSupabaseClient = cache(createClient);

export const getServerRequestContext = cache(async () => {
  const [supabase, cookieStore, headersList] = await Promise.all([
    getSupabaseClient(),
    cookies(),
    headers(),
  ]);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    session,
    cookieStore,
    location: getLocationHeaders(headersList),
    traceHeaders: getRequestTraceHeaders(headersList),
  };
});

export function buildTRPCRequestHeaders(opts: {
  session?: { access_token?: string | null } | null;
  forcePrimary?: boolean;
  location: ReturnType<typeof getLocationHeaders>;
  traceHeaders: ReturnType<typeof getRequestTraceHeaders>;
}) {
  const requestHeaders: Record<string, string> = {
    "x-user-timezone": opts.location.timezone,
    "x-user-locale": opts.location.locale,
    "x-user-country": opts.location.country,
    "x-request-id": opts.traceHeaders.requestId,
  };

  const accessToken = opts.session?.access_token;
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (opts.traceHeaders.cfRay) {
    requestHeaders["cf-ray"] = opts.traceHeaders.cfRay;
  }

  if (opts.forcePrimary) {
    requestHeaders["x-force-primary"] = "true";
  }

  return requestHeaders;
}

export function getForcePrimaryFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return cookieStore.get(Cookies.ForcePrimary)?.value === "true";
}
