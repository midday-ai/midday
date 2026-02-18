import { S3Client } from "bun";
import { env } from "../env";

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      endpoint: env.R2_ENDPOINT,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET_NAME,
    });
  }
  return _client;
}

export async function logoExists(key: string): Promise<boolean> {
  const client = getR2Client();
  return client.exists(key);
}

export async function uploadLogo(
  key: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const client = getR2Client();
  await client.write(key, data, { type: contentType });
}
