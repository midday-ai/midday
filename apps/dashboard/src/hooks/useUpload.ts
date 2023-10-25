import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import { getUserDetails } from "@midday/supabase/queries";
import { upload } from "@midday/supabase/storage";
import { useState } from "react";

export function useUpload() {
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setLoading] = useState(false);

  const uploadFile = async ({ bucketName, file, path }) => {
    setLoading(true);

    const { data: userData } = await getUserDetails(supabase);

    const result = await upload(supabase, {
      path: `${bucketName}/${userData?.team_id}/${path}`,
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
