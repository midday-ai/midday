import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

type UploadParams = {
  file: File;
  path: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path }: UploadParams,
) {
  const bytes = await file.arrayBuffer();
  const bucket = client.storage.from(path);

  const result = await bucket.upload(file.name, bytes, {
    upsert: true,
  });

  if (!result.error) {
    return bucket.getPublicUrl(file.name).data.publicUrl;
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
