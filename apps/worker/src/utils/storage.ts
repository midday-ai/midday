/**
 * Storage utility using Bun's native S3 client.
 * Used for uploading institution logos and other assets.
 */

const getStorageClient = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Storage environment variables are not set (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)",
    );
  }

  return new Bun.S3Client({
    bucket: bucketName,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    accessKeyId,
    secretAccessKey,
  });
};

/**
 * Upload a file to storage bucket.
 * @param key - The key (path) for the file in the bucket
 * @param body - The file content as Buffer
 * @param contentType - Optional content type (mime type)
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType?: string,
): Promise<void> {
  const storage = getStorageClient();

  await storage.write(key, body, {
    type: contentType,
  });
}

/**
 * Check if a file exists in storage bucket.
 * @param key - The key (path) to check
 */
export async function fileExists(key: string): Promise<boolean> {
  const storage = getStorageClient();

  return storage.exists(key);
}

/**
 * Delete a file from storage bucket.
 * @param key - The key (path) to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const storage = getStorageClient();

  await storage.delete(key);
}

/**
 * Get the public URL for a file in storage.
 * Assumes the bucket is configured with public access and a custom domain.
 * @param key - The key (path) of the file
 */
export function getPublicUrl(key: string): string {
  const cdnDomain = process.env.STORAGE_CDN_DOMAIN ?? "cdn-engine.midday.ai";
  return `https://${cdnDomain}/${key}`;
}

/**
 * Upload an institution logo to storage from a source URL.
 * @param institutionId - The institution ID (used as filename)
 * @param sourceUrl - The URL to fetch the logo from
 * @param extension - File extension (default: "jpg")
 * @returns The public URL of the uploaded logo
 */
export async function uploadInstitutionLogo(
  institutionId: string,
  sourceUrl: string,
  extension = "jpg",
): Promise<string> {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch logo from ${sourceUrl}: ${response.status}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const key = `institutions/${institutionId}.${extension}`;

  // Determine content type based on extension
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    webp: "image/webp",
  };

  const contentType = contentTypeMap[extension.toLowerCase()] || "image/jpeg";

  await uploadFile(key, buffer, contentType);

  return getPublicUrl(key);
}
