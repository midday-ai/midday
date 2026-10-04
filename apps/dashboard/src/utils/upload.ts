import { putWithProgress } from "@midday/storage/client";

export type UploadParams = {
  file: File;
  path: string[];
  bucket: "vault" | "avatars" | "apps";
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
};

type UploadDependencies = {
  createUploadUrls: (input: {
    bucket: UploadParams["bucket"];
    files: {
      path: string[];
      filename: string;
      contentType: string;
      size: number;
    }[];
  }) => Promise<
    {
      key: string;
      url: string;
      headers: Record<string, string>;
      receipt: string;
    }[]
  >;
  completeUploads: (input: {
    bucket: UploadParams["bucket"];
    files: { key: string; receipt: string }[];
  }) => Promise<{ key: string; publicUrl: string | null }[]>;
  put?: typeof putWithProgress;
};

const fileTypes: Record<string, string> = {
  csv: "text/csv",
  txt: "text/plain",
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  zip: "application/zip",
};

/** Single PUT with progress; completion verifies and registers the stored object. */
export async function uploadWithPresign(
  deps: UploadDependencies,
  { file, path, bucket, onProgress }: UploadParams,
) {
  const contentType =
    file.type ||
    fileTypes[file.name.split(".").pop()?.toLowerCase() ?? ""] ||
    "application/octet-stream";
  const [signed] = await deps.createUploadUrls({
    bucket,
    files: [{ path, filename: file.name, contentType, size: file.size }],
  });
  if (!signed) throw new Error("Upload authorization was not returned");
  await (deps.put ?? putWithProgress)(signed.url, file, {
    headers: signed.headers,
    onProgress: ({ loaded, total }) => onProgress?.(loaded, total),
  });
  const [completed] = await deps.completeUploads({
    bucket,
    files: [{ key: signed.key, receipt: signed.receipt }],
  });
  if (!completed || completed.key !== signed.key)
    throw new Error("Upload was not completed");
  return {
    filename: signed.key.split("/").at(-1)!,
    file,
    key: signed.key,
    publicUrl: completed.publicUrl,
  };
}
