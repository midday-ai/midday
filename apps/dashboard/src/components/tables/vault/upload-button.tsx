"use client";

import { Button } from "@midday/ui/button";

export function UploadButton({ disableActions }) {
  return (
    <Button
      variant="outline"
      disabled={disableActions}
      onClick={() => document.getElementById("upload-files")?.click()}
    >
      Upload
    </Button>
  );
}
