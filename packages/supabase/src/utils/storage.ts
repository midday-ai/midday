import { SupabaseClient } from "@supabase/supabase-js";

type UploadParams = {
  file: File;
  path: string;
  bucket: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams,
) {
  const b = client.storage.from(bucket);
  const fullPath = `${path}/${file.name}`;

  const result = await b.upload(fullPath, file, {
    upsert: true,
    cacheControl: "3600",
  });

  if (!result.error) {
    return b.getPublicUrl(fullPath).data.publicUrl;
  }

  throw result.error;
}

type RemoveParams = {
  path: string;
  bucket: string;
};

export async function remove(
  client: SupabaseClient,
  { bucket, path }: RemoveParams,
) {
  return client.storage.from(bucket).remove([path]);
}

export async function download(
  client: SupabaseClient,
  { bucket, path }: RemoveParams,
) {
  return client.storage.from(bucket).download(path);
}
