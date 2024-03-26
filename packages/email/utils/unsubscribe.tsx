import { SignJWT, jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.UNSUBSCRIBE_JWT_SECRET!);

type GenerateUnsubscribeLinkParams = {
  id: string;
  type: "onboarding";
};

export async function generateUnsubscribeLink({
  id,
  type,
}: GenerateUnsubscribeLinkParams) {
  const token = await new SignJWT({
    id,
    type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 day")
    .sign(secretKey);

  const url = new URL(`/unsubscribe/${token}`, "https://app.midday.ai");

  url.searchParams.append("type", type);

  return url.toString();
}

export async function verifyUnsubscribeLink(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: process.env.UNSUBSCRIBE_JWT_ISSUER,
    });

    return payload;
  } catch (e) {
    console.log("Token is invalid");
  }
}
