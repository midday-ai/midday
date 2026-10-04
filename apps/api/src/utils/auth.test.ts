import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAccessToken } from "./auth";

const names = [
  "NEXT_PUBLIC_BACKEND_PROVIDER",
  "AUTH_JWT_ISSUER",
  "AUTH_JWT_AUDIENCE",
  "AUTH_JWKS_URL",
  "SUPABASE_URL",
  "SUPABASE_JWT_SECRET",
] as const;
const original = new Map(names.map((name) => [name, process.env[name]]));
let server: ReturnType<typeof Bun.serve>;
let localKey: Awaited<ReturnType<typeof generateKeyPair>>;
let supabaseKey: Awaited<ReturnType<typeof generateKeyPair>>;
let localReads = 0;
let supabaseReads = 0;
const userId = crypto.randomUUID();
const localIssuer = "http://localhost:3001";

beforeAll(async () => {
  localKey = await generateKeyPair("EdDSA");
  supabaseKey = await generateKeyPair("ES256");
  const localJwk = {
    ...(await exportJWK(localKey.publicKey)),
    kid: "local-key",
    alg: "EdDSA",
  };
  const supabaseJwk = {
    ...(await exportJWK(supabaseKey.publicKey)),
    kid: "supabase-key",
    alg: "ES256",
  };
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      if (new URL(request.url).pathname === "/local/jwks") {
        localReads++;
        return Response.json({ keys: [localJwk] });
      }
      supabaseReads++;
      return Response.json({ keys: [supabaseJwk] });
    },
  });
});
afterEach(() => {
  for (const [name, value] of original) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});
afterAll(() => server.stop(true));
function configure() {
  process.env.SUPABASE_URL = server.url.origin;
  process.env.AUTH_JWKS_URL = `${server.url.origin}/local/jwks`;
  process.env.AUTH_JWT_ISSUER = localIssuer;
  process.env.AUTH_JWT_AUDIENCE = "midday-api";
  delete process.env.SUPABASE_JWT_SECRET;
}
function mintLocal() {
  return new SignJWT({
    email: "local@example.test",
    name: "Local User",
    aal: "aal2",
  })
    .setProtectedHeader({ alg: "EdDSA", kid: "local-key" })
    .setSubject(userId)
    .setIssuer(localIssuer)
    .setAudience("midday-api")
    .setExpirationTime("5m")
    .sign(localKey.privateKey);
}
function mintSupabase() {
  return new SignJWT({
    user_metadata: {
      email: "supabase@example.test",
      full_name: "Supabase User",
    },
    aal: "aal2",
  })
    .setProtectedHeader({ alg: "ES256", kid: "supabase-key" })
    .setSubject(userId)
    .setIssuer(`${server.url.origin}/auth/v1`)
    .setAudience("authenticated")
    .setExpirationTime("5m")
    .sign(supabaseKey.privateKey);
}
describe("selected authentication backend", () => {
  test("default Supabase accepts its JWKS and never tries local keys", async () => {
    configure();
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    const beforeLocalReads = localReads;
    expect(await verifyAccessToken(await mintSupabase())).toEqual({
      user: {
        id: userId,
        email: "supabase@example.test",
        full_name: "Supabase User",
      },
      aal: "aal2",
    });
    expect(await verifyAccessToken(await mintLocal())).toBeNull();
    expect(localReads).toBe(beforeLocalReads);
  });
  test("explicit local accepts only its JWT issuer and keys", async () => {
    configure();
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    const beforeSupabaseReads = supabaseReads;
    expect(await verifyAccessToken(await mintLocal())).toEqual({
      user: {
        id: userId,
        email: "local@example.test",
        full_name: "Local User",
      },
      aal: "aal2",
    });
    expect(await verifyAccessToken(await mintSupabase())).toBeNull();
    expect(supabaseReads).toBe(beforeSupabaseReads);
  });
  test("Supabase preserves legacy HS256 without needing local auth configuration", async () => {
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    delete process.env.AUTH_JWKS_URL;
    delete process.env.AUTH_JWT_ISSUER;
    delete process.env.AUTH_JWT_AUDIENCE;
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_JWT_SECRET = crypto.randomUUID();
    const token = await new SignJWT({
      user_metadata: { email: "legacy@example.test", full_name: "Legacy User" },
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));
    expect((await verifyAccessToken(token))?.user.email).toBe(
      "legacy@example.test",
    );
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    process.env.AUTH_JWKS_URL = `${server.url.origin}/local/jwks`;
    expect(await verifyAccessToken(token)).toBeNull();
  });
});
