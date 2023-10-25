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

    const basePath = `${bucketName}/${userData?.team_id}/${path}`;
    const filePath = `${userData?.team_id}/${path}/${file.name}`;

    const url = await upload(supabase, {
      path: basePath,
      file,
    });

    setLoading(false);

    return {
      url,
      path: filePath,
    };
  };

  return {
    uploadFile,
    isLoading,
  };
}
