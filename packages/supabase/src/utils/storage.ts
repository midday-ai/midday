import { SupabaseClient } from "@supabase/supabase-js";
import * as tus from "tus-js-client";

export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = ".emptyFolderPlaceholder";

type UploadParams = {
  file: File;
  path: string;
  bucket: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams
) {
  const storage = client.storage.from(bucket);
  const fullPath = `${path}/${file.name}`;

  const result = await storage.upload(fullPath, file, {
    upsert: true,
    cacheControl: "3600",
  });

  if (!result.error) {
    return storage.getPublicUrl(fullPath).data.publicUrl;
  }

  throw result.error;
}

type ResumableUploadParmas = {
  file: File;
  path: string;
  bucket: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
};

export async function resumableUpload(
  client: SupabaseClient,
  { file, path, bucket, onProgress }: ResumableUploadParmas
) {
  const {
    data: { session },
  } = await client.auth.getSession();

  const fullPath = `${path}/${file.name}`;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${process.env.NEXT_PUBLIC_SUPABASE_ID}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session?.access_token}`,
        // optionally set upsert to true to overwrite existing files
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: fullPath,
        contentType: file.type,
        cacheControl: "3600",
      },
      // NOTE: it must be set to 6MB (for now) do not change it
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => {
        reject(error);
      },
      onProgress,
      onSuccess: () => {
        resolve(upload);
      },
    });

    // Check if there are any previous uploads to continue.
    return upload.findPreviousUploads().then((previousUploads) => {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      upload.start();
    });
  });
}

type RemoveParams = {
  path: string;
  bucket: string;
};

export async function remove(
  client: SupabaseClient,
  { bucket, path }: RemoveParams
) {
  return client.storage.from(bucket).remove([path]);
}

type DeleteFolderParams = {
  path: string;
  bucket: string;
};

export async function deleteFolder(
  client: SupabaseClient,
  { bucket, path }: DeleteFolderParams
) {
  const { data: list } = await client.storage.from(bucket).list(path);
  const filesToRemove = list?.map((file) => `${path}/${file.name}`);
  return client.storage.from(bucket).remove([...filesToRemove, path]);
}

type CreateFolderParams = {
  path: string;
  name: string;
  bucket: string;
};

export async function createFolder(
  client: SupabaseClient,
  { bucket, path, name }: CreateFolderParams
) {
  const fullPath = `${path}/${name}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`;

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
