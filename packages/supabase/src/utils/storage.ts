import type { SupabaseClient } from "@supabase/supabase-js";

export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = ".emptyFolderPlaceholder";

type UploadParams = {
  file: File;
  path: string[];
  bucket: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams
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
  { bucket, path }: RemoveParams
) {
  return client.storage
    .from(bucket)
    .remove([decodeURIComponent(path.join("/"))]);
}

type DeleteFolderParams = {
  path: string[];
  bucket: string;
};

export async function deleteFolder(
  client: SupabaseClient,
  { bucket, path }: DeleteFolderParams
) {
  const { data: list } = await client.storage
    .from(bucket)
    .list(decodeURIComponent(path.join("/")));

  const filesToRemove = list?.flatMap((file) => {
    // Folder, remove empty file before folder
    if (!file.id) {
      return [
        `${decodeURIComponent(
          [...path, file.name].join("/")
        )}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`,
        decodeURIComponent([...path, file.name].join("/")),
      ];
    }

    return [decodeURIComponent([...path, file.name].join("/"))];
  });

  return client.storage.from(bucket).remove(filesToRemove);
}

type CreateFolderParams = {
  path: string[];
  name: string;
  bucket: string;
};

export async function createFolder(
  client: SupabaseClient,
  { bucket, path, name }: CreateFolderParams
) {
  const fullPath = decodeURIComponent(
    [...path, name, EMPTY_FOLDER_PLACEHOLDER_FILE_NAME].join("/")
  );

  const { error, data } = await client.storage
    .from(bucket)
    .upload(fullPath, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME));

  if (error) {
    throw Error(error.message);
  }

  return data;
}

type DownloadParams = {
  path: string;
  bucket: string;
};

export async function download(
  client: SupabaseClient,
  { bucket, path }: DownloadParams
) {
  return client.storage.from(bucket).download(path);
}

type ShareParams = {
  path: string;
  bucket: string;
  expireIn: number;
  options?: {
    download?: boolean;
  };
};

export async function share(
  client: SupabaseClient,
  { bucket, path, expireIn, options }: ShareParams
) {
  return client.storage.from(bucket).createSignedUrl(path, expireIn, options);
}
