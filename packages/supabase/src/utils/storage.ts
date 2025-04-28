import type { SupabaseClient } from "@supabase/supabase-js";

export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = ".emptyFolderPlaceholder";

type UploadParams = {
  file: File;
  path: string[];
  bucket: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams,
) {
  const storage = client.storage.from(bucket);

  const result = await storage.upload(path.join("/"), file, {
    upsert: true,
    cacheControl: "3600",
  });

  if (!result.error) {
    return storage.getPublicUrl(path.join("/")).data.publicUrl;
  }

  throw result.error;
}

type RemoveParams = {
  path: string[];
  bucket: string;
};

export async function remove(
  client: SupabaseClient,
  { bucket, path }: RemoveParams,
) {
  return client.storage
    .from(bucket)
    .remove([decodeURIComponent(path.join("/"))]);
}

type DownloadParams = {
  path: string;
  bucket: string;
};

export async function download(
  client: SupabaseClient,
  { bucket, path }: DownloadParams,
) {
  return client.storage.from(bucket).download(path);
}

type SignedUrlParams = {
  path: string;
  bucket: string;
  expireIn: number;
  options?: {
    download?: boolean;
  };
};

export async function signedUrl(
  client: SupabaseClient,
  { bucket, path, expireIn, options }: SignedUrlParams,
) {
  return client.storage.from(bucket).createSignedUrl(path, expireIn, options);
}
