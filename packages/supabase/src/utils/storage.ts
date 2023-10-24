import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

type Data = {
  file: File;
  path: string;
};

export async function upload(client: SupabaseClient, { file, path }: Data) {
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
