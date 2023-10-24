import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import { upload } from "@midday/supabase/storage";
import { useState } from "react";

export function useUpload() {
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setLoading] = useState(false);

  const uploadFile = async ({ bucketName, file, path }) => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const result = await upload(supabase, {
      path: `${bucketName}/${session.user.id}/${path}`,
      file,
    });

    setLoading(false);

    return result;
  };

  return {
    uploadFile,
    isLoading,
  };
}
