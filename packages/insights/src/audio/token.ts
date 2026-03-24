/**
 * JWT token utilities for public audio access
 *
 * Tokens are used to allow unauthenticated access to audio files
 * (e.g., from email links) while maintaining security.
 */
import * as jose from "jose";

/**
 * Payload stored in the audio access token
 */
export type AudioTokenPayload = {
  insightId: string;
  teamId: string;
};

/**
 * Default token expiry: 7 days (matches email link validity)
 */
const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

/**
 * Get the JWT secret, throwing if not configured
 */
function getSecret(): Uint8Array {
  const secret = process.env.INSIGHTS_AUDIO_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "INSIGHTS_AUDIO_TOKEN_SECRET environment variable is not set",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Check if audio tokens are enabled (secret is configured)
 */
export function isAudioTokenEnabled(): boolean {
  return !!process.env.INSIGHTS_AUDIO_TOKEN_SECRET;
}

/**
 * Create a signed JWT token for audio access
 *
 * @param insightId - The insight ID to grant access to
 * @param teamId - The team ID (for validation)
 * @param expiresInSeconds - Token validity period (default: 7 days)
 * @returns Signed JWT token
 */
export async function createAudioToken(
  insightId: string,
  teamId: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const secret = getSecret();

  const token = await new jose.SignJWT({
    insightId,
    teamId,
  } satisfies AudioTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secret);

  return token;
}

/**
 * Verify and decode an audio access token
 *
 * @param token - The JWT token to verify
 * @returns Decoded payload with insightId and teamId
 * @throws Error if token is invalid, expired, or malformed
 */
export async function verifyAudioToken(
  token: string,
): Promise<AudioTokenPayload> {
  const secret = getSecret();

  try {
    const { payload } = await jose.jwtVerify(token, secret);

    // Validate required fields
    if (
      typeof payload.insightId !== "string" ||
      typeof payload.teamId !== "string"
    ) {
      throw new Error("Invalid token payload: missing required fields");
    }

    return {
      insightId: payload.insightId,
      teamId: payload.teamId,
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new Error("Audio token has expired");
    }
    if (error instanceof jose.errors.JWTInvalid) {
      throw new Error("Invalid audio token");
    }
    throw error;
  }
}

/**
 * Build the public audio URL with token for email links
 *
 * @param baseUrl - API base URL (e.g., "https://api.midday.ai")
 * @param insightId - The insight ID
 * @param token - The signed JWT token
 * @returns Full URL for public audio access
 */
export function buildAudioUrl(
  baseUrl: string,
  insightId: string,
  token: string,
): string {
  return `${baseUrl}/v1/insights/${insightId}/audio?token=${encodeURIComponent(token)}`;
}
