import { getBackendProvider } from "@midday/utils/backend";
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

export type Session = {
  user: { id: string; email?: string; full_name?: string };
  teamId?: string;
  aal?: string;
};
const keysets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function getKeyset(url: string) {
  let keys = keysets.get(url);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(url));
    keysets.set(url, keys);
  }
  return keys;
}
function extractSession(
  payload: JWTPayload,
  provider: "local" | "supabase",
): Session | null {
  if (!payload.sub) return null;
  const metadata =
    provider === "supabase" &&
    payload.user_metadata &&
    typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : payload;
  const name = provider === "supabase" ? metadata.full_name : payload.name;
  return {
    user: {
      id: payload.sub,
      email: typeof metadata.email === "string" ? metadata.email : undefined,
      full_name: typeof name === "string" ? name : undefined,
    },
    aal: typeof payload.aal === "string" ? payload.aal : "aal1",
  };
}
export async function verifyAccessToken(
  accessToken?: string,
): Promise<Session | null> {
  if (!accessToken) return null;
  const provider = getBackendProvider();
  if (provider === "local") {
    const issuer = process.env.AUTH_JWT_ISSUER ?? "http://localhost:3001";
    try {
      const { payload } = await jwtVerify(
        accessToken,
        getKeyset(process.env.AUTH_JWKS_URL ?? `${issuer}/api/auth/jwks`),
        {
          issuer,
          audience: process.env.AUTH_JWT_AUDIENCE ?? "midday-api",
          algorithms: ["EdDSA"],
        },
      );
      return extractSession(payload, provider);
    } catch {
      return null;
    }
  }
  // Preserve Supabase asymmetric keys and the existing HS256 rotation fallback.
  // Neither verification branch consults local-backend keys or secrets.
  try {
    const { payload } = await jwtVerify(
      accessToken,
      getKeyset(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
      { algorithms: ["ES256", "RS256"] },
    );
    return extractSession(payload, provider);
  } catch {
    if (!process.env.SUPABASE_JWT_SECRET) return null;
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET),
        { algorithms: ["HS256"] },
      );
      return extractSession(payload, provider);
    } catch {
      return null;
    }
  }
}
