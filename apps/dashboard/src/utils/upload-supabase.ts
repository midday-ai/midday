import { stripSpecialCharacters } from "@midday/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import type { UploadParams } from "./upload";

/** Existing Supabase resumable transport, loaded only for that backend. */
export async function uploadWithSupabaseTus(
  client: SupabaseClient,
  { file, path, bucket, onProgress }: UploadParams,
) {
  const tus = await import("tus-js-client");
  const {
    data: { session },
  } = await client.auth.getSession();
  const filename = stripSpecialCharacters(file.name);
  const key = [...path, filename].join("/");
  return new Promise<{
    filename: string;
    file: File;
    key: string;
    publicUrl: null;
  }>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: process.env.NEXT_PUBLIC_SUPABASE_ID
        ? `https://${process.env.NEXT_PUBLIC_SUPABASE_ID}.supabase.co/storage/v1/upload/resumable`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session?.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: key,
        contentType: file.type,
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress,
      onSuccess: () => resolve({ filename, file, key, publicUrl: null }),
    });
    upload
      .findPreviousUploads()
      .then((previous) => {
        if (previous[0]) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      })
      .catch(reject);
  });
}

/** Public asset and small-file uploads retain Supabase upload/getPublicUrl behavior. */
export async function uploadWithSupabase(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams,
) {
  const extension = file.name.split(".").pop() ?? "";
  const filename =
    bucket === "apps"
      ? `${nanoid()}${extension ? `.${extension}` : ""}`
      : stripSpecialCharacters(file.name);
  const key = [...path, filename].join("/");
  const storage = client.storage.from(bucket);
  const { error } = await storage.upload(key, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;
  return {
    url: storage.getPublicUrl(key).data.publicUrl,
    path: key.split("/"),
  };
}
