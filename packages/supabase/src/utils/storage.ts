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
  const [name, extension] = file.name.split(".");
  const fileName = `${name}.${extension}`;

  const result = await bucket.upload(`${fileName}`, bytes, {
    upsert: true,
  });

  if (!result.error) {
    return bucket.getPublicUrl(fileName).data.publicUrl;
  }

  throw result.error;
}

type RemoveParams = {
  path: string;
  file: string;
};

export async function remove(
  client: SupabaseClient,
  { path, file }: RemoveParams,
) {
  console.log(path);
  console.log(file);
  await client.storage.from(path).remove([file]);
}
