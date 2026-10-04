"use client";

import { isLocalBackend } from "@midday/utils/backend";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { type UploadParams, uploadWithPresign } from "@/utils/upload";

/** Supabase keeps resumable TUS; local storage uses presigned PUT with progress. */
export function useResumableUpload() {
  const trpc = useTRPC();
  const { mutateAsync: createUploadUrls } = useMutation(
    trpc.storage.createUploadUrls.mutationOptions(),
  );
  const { mutateAsync: completeUploads } = useMutation(
    trpc.storage.completeUploads.mutationOptions(),
  );
  const resumableUpload = useCallback(
    async (params: UploadParams) => {
      if (isLocalBackend())
        return uploadWithPresign({ createUploadUrls, completeUploads }, params);
      const [{ createClient }, { uploadWithSupabaseTus }] = await Promise.all([
        import("@midday/supabase/client"),
        import("@/utils/upload-supabase"),
      ]);
      return uploadWithSupabaseTus(createClient(), params);
    },
    [createUploadUrls, completeUploads],
  );
  return { resumableUpload };
}
