"use client";

import { isLocalBackend } from "@midday/utils/backend";
import { useState } from "react";
import { useResumableUpload } from "@/hooks/use-resumable-upload";
import type { UploadParams } from "@/utils/upload";

export function useUpload() {
  const { resumableUpload } = useResumableUpload();
  const [pending, setPending] = useState(0);
  const uploadFile = async (
    params: UploadParams,
  ): Promise<{ url: string; path: string[] }> => {
    setPending((count) => count + 1);
    try {
      if (!isLocalBackend()) {
        const [{ createClient }, { uploadWithSupabase }] = await Promise.all([
          import("@midday/supabase/client"),
          import("@/utils/upload-supabase"),
        ]);
        return uploadWithSupabase(createClient(), params);
      }
      const result = await resumableUpload(params);
      return {
        url: result.publicUrl ?? result.key,
        path: result.key.split("/"),
      };
    } finally {
      setPending((count) => count - 1);
    }
  };
  return { uploadFile, isLoading: pending > 0 };
}
