import crypto from "node:crypto";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import {
  Configuration,
  type JWKPublicKey,
  PlaidApi,
  PlaidEnvironments,
} from "plaid";

const KEY_CACHE = new Map<
  string,
  { jwk: JWKPublicKey; expiredAt: number | null }
>();

function getPlaidClient() {
  return new PlaidApi(
    new Configuration({
      basePath:
        PlaidEnvironments[process.env.PLAID_ENVIRONMENT ?? "production"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
          "PLAID-SECRET": process.env.PLAID_SECRET!,
        },
      },
    }),
  );
}

async function fetchVerificationKey(
  keyId: string,
): Promise<{ jwk: JWKPublicKey; expiredAt: number | null } | null> {
  try {
    const { data } = await getPlaidClient().webhookVerificationKeyGet({
      key_id: keyId,
    });

    return { jwk: data.key, expiredAt: data.key.expired_at };
  } catch {
    return null;
  }
}

/**
 * Verify a Plaid webhook using the Plaid-Verification JWT header.
 * https://plaid.com/docs/api/webhooks/webhook-verification
 *
 * 1. Decode JWT header -> extract kid, verify alg is ES256
 * 2. Fetch the JWK from Plaid via SDK (cached per kid)
 * 3. Verify JWT signature
 * 4. Verify iat is within 5 minutes
 * 5. Verify request_body_sha256 matches SHA-256 of the raw body
 */
export async function validatePlaidWebhook(params: {
  body: string;
  verificationHeader: string | null;
}): Promise<boolean> {
  if (!params.verificationHeader) {
    return false;
  }

  try {
    const token = params.verificationHeader;

    const header = decodeProtectedHeader(token);

    if (header.alg !== "ES256" || !header.kid) {
      return false;
    }

    const { kid } = header;

    if (!KEY_CACHE.has(kid)) {
      for (const [cachedKid, cached] of KEY_CACHE) {
        if (cached.expiredAt === null) {
          const refreshed = await fetchVerificationKey(cachedKid);
          if (refreshed) {
            KEY_CACHE.set(cachedKid, refreshed);
          }
        }
      }

      const fetched = await fetchVerificationKey(kid);
      if (fetched) {
        KEY_CACHE.set(kid, fetched);
      }
    }

    const cached = KEY_CACHE.get(kid);
    if (!cached || cached.expiredAt !== null) {
      return false;
    }

    const { alg, crv, kid: _kid, kty, use, x, y } = cached.jwk;
    const publicKey = await importJWK({ alg, crv, kty, use, x, y }, "ES256");

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["ES256"],
      maxTokenAge: "5 min",
    });

    const claimedHash = (payload as Record<string, unknown>)
      .request_body_sha256;

    if (!claimedHash || typeof claimedHash !== "string") {
      return false;
    }

    const bodyHash = crypto
      .createHash("sha256")
      .update(params.body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(bodyHash),
      Buffer.from(claimedHash),
    );
  } catch {
    return false;
  }
}
