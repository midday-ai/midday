import crypto from "node:crypto";

export function generateDeterministicId(input: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}
