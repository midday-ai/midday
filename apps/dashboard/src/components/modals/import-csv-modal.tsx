"use client";

import { useUpload } from "@/hooks/use-upload";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import { stripSpecialCharacters } from "@midday/utils";
import { useQueryState } from "nuqs";
import { useDropzone } from "react-dropzone";

export function ImportCSVModal() {
  const supabase = createClient();
  const [step, setStep] = useQueryState("step");
  const { uploadFile } = useUpload();

  const isOpen = step === "import-csv";

  const onDrop = async ([file]) => {
    const { data: userData } = await getCurrentUserTeamQuery(supabase);

    const filename = stripSpecialCharacters(file.name);

    const { path } = await uploadFile({
      bucket: "vault",
      path: [userData?.team_id, "imports", filename],
      file,
    });

    console.log(path);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles: 1,
      onDrop,
      maxSize: 3000000, // 3MB
      accept: { "text/csv": [".csv"] },
    });

  return (
    <Dialog open={isOpen} onOpenChange={() => setStep(null)}>
      <DialogContent>
        <div className="p-4 pb-0">
          <DialogHeader>
            <div className="flex space-x-4 items-center mb-4">
              <button
                type="button"
                className="items-center rounded border bg-accent p-1"
                onClick={() => setStep("connect")}
              >
                <Icons.ArrowBack />
              </button>
              <DialogTitle className="m-0 p-0">Import CSV</DialogTitle>
            </div>
            <DialogDescription>
              Upload your CSV file with transactions.
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "w-full border border-dashed h-[200px] rounded-md mt-8 mb-8 flex items-center justify-center",
              isDragActive && "bg-secondary text-primary",
              isDragReject && "border-destructive"
            )}
            {...getRootProps()}
          >
            <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787]">
              <input {...getInputProps()} id="upload-files" />
              Drop your file here, or click to browse.
              <span>3MB file limit.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <Icons.OpenAI />
        </div>
      </DialogContent>
    </Dialog>
  );
}
