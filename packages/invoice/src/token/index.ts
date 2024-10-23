import * as jose from "jose";

export async function verify(token: string) {
  const secret = new TextEncoder().encode(process.env.INVOICE_JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);

  return payload;
}

export async function generateToken(id: string) {
  const secret = new TextEncoder().encode(process.env.INVOICE_JWT_SECRET);
  const token = await new jose.SignJWT({ id })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  return token;
}
