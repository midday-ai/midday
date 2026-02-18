import { Buffer } from "node:buffer";
import * as jose from "jose";
import xior from "xior";

const APP_ID = process.env.ENABLEBANKING_APPLICATION_ID!;
const KEY_CONTENT = process.env.ENABLE_BANKING_KEY_CONTENT!;

async function getJwt() {
  const header = jose.base64url.encode(
    Buffer.from(JSON.stringify({ typ: "JWT", alg: "RS256", kid: APP_ID })),
  );
  const timestamp = Math.floor(Date.now() / 1000);
  const body = jose.base64url.encode(
    Buffer.from(
      JSON.stringify({
        iss: "enablebanking.com",
        aud: "api.enablebanking.com",
        iat: timestamp,
        exp: timestamp + 3600,
      }),
    ),
  );
  const keyBuffer = Buffer.from(KEY_CONTENT, "base64");
  const privateKey = await jose.importPKCS8(
    keyBuffer.toString("utf8"),
    "RS256",
  );
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    privateKey,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${jose.base64url.encode(new Uint8Array(signature))}`;
}

async function main() {
  const jwt = await getJwt();
  const api = xior.create({
    baseURL: "https://api.enablebanking.com",
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
  });

  console.log("App ID:", APP_ID);
  console.log("\n=== Application Config ===");
  const { data: app } = await api.get("/application");
  console.log(JSON.stringify(app, null, 2));

  console.log("\n=== Société Générale in /aspsps ===");
  const { data: aspsps } = await api.get("/aspsps", {
    params: { country: "FR" },
  });
  const matches = aspsps.aspsps.filter((i: any) =>
    i.name.includes("Société Générale"),
  );
  for (const inst of matches) {
    console.log(
      JSON.stringify(
        {
          name: inst.name,
          country: inst.country,
          psu_types: inst.psu_types,
          beta: inst.beta,
        },
        null,
        2,
      ),
    );
  }
  if (matches.length === 0) {
    console.log("  NO MATCHES FOUND");
    // Try fuzzy
    const fuzzy = aspsps.aspsps.filter(
      (i: any) =>
        i.name.toLowerCase().includes("societe") ||
        i.name.toLowerCase().includes("société"),
    );
    console.log(
      "  Fuzzy matches:",
      fuzzy.map((i: any) => i.name),
    );
  }
}

main().catch(console.error);
