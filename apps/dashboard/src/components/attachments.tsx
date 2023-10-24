"use client";

import { useUpload } from "@/hooks/useUpload";
import { Button } from "@midday/ui/button";
import { Progress } from "@midday/ui/progress";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/utils";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { File, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

const Item = ({ progress, file }) => {
  const isPresent = useIsPresent();
  const animations = {
    style: {
      position: isPresent ? "static" : "absolute",
    },
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: {
      opacity: 0,
    },
    transition: { opacity: { duration: 0.4 } },
  };

  return (
    <motion.li
      {...animations}
      layout
      className="flex items-center justify-between"
    >
      <div className="flex space-x-4 w-[80%] items-center">
        <div className="rounded-md border w-[40px] h-[40px] flex items-center justify-center">
          <File size={18} />
        </div>
        <div className="flex-col space-y-2 w-[80%]">
          <span>{file.name}</span>
          {progress < 100 && <Progress value={progress} className="h-[3px]" />}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-auto hover:bg-transparent flex"
      >
        <X size={14} />
      </Button>
    </motion.li>
  );
};

export function Attachments({ id }) {
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const { isLoading, uploadFile } = useUpload();

  const onDrop = async (acceptedFiles: Array<File>) => {
    setFiles(acceptedFiles);

    setInterval(() => setProgress((progress) => progress + 1), 10);

    const file = await uploadFile({
      bucketName: "documents",
      path: `transactions/${id}`,
      file: acceptedFiles.at(0),
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        className={cn(
          "w-full h-[120px] border-dotted border-2 border-border rounded-xl text-center flex flex-col justify-center space-y-1 transition-colors",
          isDragActive && "bg-secondary",
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div>
            <p className="text-xs">Drop your files upload</p>
          </div>
        ) : (
          <div>
            <p className="text-xs">
              Drop your files here, or{" "}
              <span className="underline underline-offset-1">
                click to browse.
              </span>
            </p>
            <p className="text-xs text-dark-gray">3MB file limit.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        <ul className="mt-4 space-y-4">
          {files.map((file) => (
            <Item key={file.name} progress={progress} file={file} />
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}
