import { type JWTPayload, jwtVerify } from "jose";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
};

type SupabaseJWTPayload = JWTPayload & {
  user_metadata?: {
    email?: string;
    full_name?: string;
  };
  aal?: string; // Authentication Assurance Level (aal1 = password, aal2 = MFA)
};

/**
 * Verify Supabase JWT locally without HTTP call.
 * Uses the same HS256 verification that Supabase's backend uses.
 *
 * This is secure because:
 * 1. We verify the signature with SUPABASE_JWT_SECRET
 * 2. jose automatically checks expiration (exp claim)
 * 3. Only runs server-side where secret is safe
 *
 * @param accessToken - The JWT access token from Supabase auth
 * @returns Session object if valid, null if invalid/expired, plus AAL level for MFA
 */
export async function verifyAccessToken(
  accessToken?: string,
): Promise<{ session: Session | null; aal?: string }> {
  if (!accessToken) {
    return { session: null };
  }

  try {
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET),
    );

    const supabasePayload = payload as SupabaseJWTPayload;

    return {
      session: {
        user: {
          id: supabasePayload.sub!,
          email: supabasePayload.user_metadata?.email,
          full_name: supabasePayload.user_metadata?.full_name,
        },
      },
      aal: supabasePayload.aal,
    };
  } catch {
    // Token invalid, expired, or signature mismatch
    return { session: null };
  }
}
