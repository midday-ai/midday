import { getTransactionsFromLayout } from "@/actions/transactions/get-transactions-from-layout";
import { useUpload } from "@/hooks/use-upload";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { Spinner } from "@midday/ui/spinner";
import { stripSpecialCharacters } from "@midday/utils";
import { useAction } from "next-safe-action/hooks";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import { Controller } from "react-hook-form";
import { useCsvContext } from "./context";
import { readLines } from "./utils";

export function SelectFile() {
  const supabase = createClient();
  const { watch, control, setFileColumns, setFirstRows, setValue } =
    useCsvContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFile } = useUpload();

  const { team_id: teamId } = useUserContext((state) => state.data);

  const getTransactions = useAction(getTransactionsFromLayout, {
    onSuccess: ({ data }) => {
      const { columns, results } = data;

      setValue("table", results);
      setFileColumns(columns);

      // Skip the first row because it can be the header row
      setFirstRows(results.slice(1, 4));
      setIsLoading(false);
    },
    onError: () => {
      setError("Something went wrong while processing the file.");
      setIsLoading(false);
    },
  });

  const file = watch("file");

  async function processFile() {
    if (!file) {
      setFileColumns(null);
      return;
    }

    setIsLoading(true);

    if (file?.type !== "text/csv") {
      try {
        setValue("import_type", "image");

        const filename = stripSpecialCharacters(file.name);

        const { path } = await uploadFile({
          bucket: "vault",
          path: [teamId, "imports", filename],
          file,
        });

        getTransactions.execute({ filePath: path });
      } catch (error) {
        setError("Something went wrong while processing the file.");
        setIsLoading(false);
      }

      return;
    }

    setValue("import_type", "csv");

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
          setIsLoading(false);
          return;
        }

        if (!meta || !meta.fields || meta.fields.length <= 1) {
          setError("Failed to retrieve CSV column data.");
          setFileColumns(null);
          setFirstRows(null);
          setIsLoading(false);
          return;
        }

        setFileColumns(meta.fields);
        setFirstRows(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to read CSV file.");
        setFileColumns(null);
        setFirstRows(null);
        setIsLoading(false);
      });
  }

  useEffect(() => {
    processFile();
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

                  {isLoading ? (
                    <div className="flex space-x-1 items-center">
                      <Spinner />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div>
                      <p>Drop your file here, or click to browse.</p>
                      <span>5MB file limit.</span>
                      <span className="mt-2 text-[10px]">
                        CSV, PDF, jpg or png
                      </span>
                    </div>
                  )}

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
