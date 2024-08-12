import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import { stripSpecialCharacters } from "@midday/utils";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import { Controller } from "react-hook-form";
import { useCsvContext } from "./context";
import { readLines } from "./utils";

export function SelectFile() {
  const { watch, control, setFileColumns, setFirstRows } = useCsvContext();
  const [error, setError] = useState<string | null>(null);

  const file = watch("file");

  useEffect(async () => {
    if (!file) {
      setFileColumns(null);
      return;
    }

    if (file?.type !== "text/csv") {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);

      const filename = stripSpecialCharacters(file.name);

      const { path } = await uploadFile({
        bucket: "vault",
        path: [userData?.team_id, "imports", filename],
        file,
      });

      console.log(path);

      return;
    }

    readLines(file, 4)
      .then((lines) => {
        const { data, meta } = Papa.parse(lines, {
          worker: false,
          skipEmptyLines: true,
          header: true,
        });

        if (!data || data.length < 2) {
          setError("CSV file must have at least 2 rows.");
          setFileColumns(null);
          setFirstRows(null);
          return;
        }

        if (!meta || !meta.fields || meta.fields.length <= 1) {
          setError("Failed to retrieve CSV column data.");
          setFileColumns(null);
          setFirstRows(null);
          return;
        }

        setFileColumns(meta.fields);
        setFirstRows(data);
      })
      .catch(() => {
        setError("Failed to read CSV file.");
        setFileColumns(null);
        setFirstRows(null);
      });
  }, [file]);

  return (
    <div className="flex flex-col gap-3">
      <Controller
        control={control}
        name="file"
        render={({ field: { onChange, onBlur } }) => (
          <Dropzone
            onDrop={([file]) => onChange(file)}
            maxFiles={1}
            accept={{
              "text/csv": [".csv"],
              "image/jpeg": [".jpg"],
              "image/png": [".png"],
            }}
            maxSize={5000000}
          >
            {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
              <div
                {...getRootProps()}
                className={cn(
                  "w-full border border-dashed h-[200px] mt-8 mb-8 flex items-center justify-center",
                  isDragActive && "bg-secondary text-primary",
                  isDragReject && "border-destructive",
                )}
              >
                <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787]">
                  <input {...getInputProps()} onBlur={onBlur} />
                  <p>Drop your file here, or click to browse.</p>
                  <span>5MB file limit.</span>
                  <span className="mt-2 text-[10px]">CSV, PDF, jpg or png</span>

                  {error && (
                    <p className="text-center text-sm text-red-600 mt-4">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Dropzone>
        )}
      />
    </div>
  );
}
function uploadFile(arg0: { bucket: string; path: any[]; file: File }):
  | { path: any }
  | PromiseLike<{ path: any }> {
  throw new Error("Function not implemented.");
}
