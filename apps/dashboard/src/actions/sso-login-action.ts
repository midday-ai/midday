"use server";

import { createClient } from "@midday/supabase/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { actionClient } from "./safe-action";

const SSO_SECRET = process.env.SSO_SECRET;
const FEATUREBASE_SUBDOMAIN = process.env.FEATUREBASE_SUBDOMAIN;

export const ssoLoginAction = actionClient.action(async () => {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const user = session.user;

  // Create the payload
  const payload = {
    email: user.email,
    name: user.user_metadata.full_name,
    external_id: user.id,
    // Add any other required fields here
  };

  // Create and sign the JWT
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SSO_SECRET));

  // Set a cookie to remember the user's SSO state (optional)
  cookies().set("sso_active", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Return the JWT instead of redirecting
  return jwt;
});
