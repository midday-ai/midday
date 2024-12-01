import crypto from "node:crypto";

// https://teller.io/docs/api/webhooks#verifying-messages
export const validateTellerSignature = (params: {
  signatureHeader: string | null;
  text: string;
}): boolean => {
  if (!params.signatureHeader) {
    return false;
  }

  const { timestamp, signatures } = parseTellerSignatureHeader(
    params.signatureHeader,
  );

  const threeMinutesAgo = Math.floor(Date.now() / 1000) - 3 * 60;

  if (Number.parseInt(timestamp) < threeMinutesAgo) {
    return false;
  }

  // Ensure the text is used as a raw string
  const signedMessage = `${timestamp}.${params.text}`;
  const calculatedSignature = crypto
    .createHmac("sha256", process.env.TELLER_SIGNING_SECRET!)
    .update(signedMessage)
    .digest("hex");

  // Compare calculated signature with provided signatures
  return signatures.includes(calculatedSignature);
};

export const parseTellerSignatureHeader = (
  header: string,
): { timestamp: string; signatures: string[] } => {
  const parts = header.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signatureParts = parts.filter((p) => p.startsWith("v1="));

  if (!timestampPart) {
    throw new Error("No timestamp in Teller-Signature header");
  }

  const timestamp = timestampPart.split("=")[1];
  const signatures = signatureParts
    .map((p) => p.split("=")[1])
    .filter((sig): sig is string => sig !== undefined);

  if (!timestamp || signatures.some((sig) => !sig)) {
    throw new Error("Invalid Teller-Signature header format");
  }

  return { timestamp, signatures };
};
