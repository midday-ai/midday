"use client";

import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import {
  useDropzone,
  type DropzoneOptions,
  type DropzoneState,
  type FileRejection,
} from "react-dropzone";
import { toast } from "sonner";
import { useControllableState } from "../../hooks/useControllableState";
import { formatBytes } from "../../lib/file-upload-utils";

import { cn } from "../../utils/cn";
import { Button } from "../button";
import { Input } from "../input";
import { Progress } from "../progress";

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the uploader.
   *
   * @example
   *   value = { files };
   *
   * @default undefined
   * @type File[]
   */
  value?: File[];

  /**
   * Function to be called when the value changes.
   *
   * @example
   *   onValueChange={(files) => setFiles(files)}
   *
   * @default undefined
   * @type React.Dispatch<React.SetStateAction<File[]>>
   */
  onValueChange?: React.Dispatch<React.SetStateAction<File[]>>;

  /**
   * Function to be called when files are uploaded.
   *
   * @example
   *   onUpload={(files) => uploadFiles(files)}
   *
   * @default undefined
   * @type (files: File[]) => Promise<void>
   */
  onUpload?: (files: File[]) => Promise<void>;

  /**
   * Progress of the uploaded files.
   *
   * @example
   *   progresses={{ "file1.png": 50 }}
   *
   * @default undefined
   * @type Record<string, Number> | undefined
   */
  progresses?: Record<string, number>;

  /**
   * Options for the dropzone.
   *
   * @example
   *   opts={{ maxFiles: 3, multiple: true }}
   *
   * @default undefined
   * @type DropzoneOptions
   *
   *   | undefined
   */
  opts?: DropzoneOptions;
}

interface FileUploaderContextProps extends DropzoneState {
  files: File[];
  maxFiles: number;
  maxSize: number;
  setFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  progresses?: Record<string, number>;
  disabled: boolean;
}

const FileUploaderContext =
  React.createContext<FileUploaderContextProps | null>(null);

function useFileUploader() {
  const context = React.useContext(FileUploaderContext);

  if (!context) {
    throw new Error("useFileUploader must be used within a <FileUploader />");
  }

  return context;
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}

const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      value: valueProp,
      onValueChange,
      onUpload,
      progresses,
      opts,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const {
      accept = { "image/*": [] },
      maxSize = 1024 * 1024 * 4,
      maxFiles = 1,
      multiple = false,
      disabled = false,
      ...dropzoneProps
    } = opts ?? {};

    const [files, setFiles] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
    });

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        if (!multiple && maxFiles === 1 && acceptedFiles.length > 1) {
          toast.error("Cannot upload more than 1 file at a time");
          return;
        }

        if ((files?.length ?? 0) + acceptedFiles.length > maxFiles) {
          toast.error(`Cannot upload more than ${maxFiles} files`);
          return;
        }

        const newFiles = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        );

        const updatedFiles = files ? [...files, ...newFiles] : newFiles;

        setFiles(updatedFiles);

        if (rejectedFiles.length > 0) {
          rejectedFiles.forEach(({ file }) => {
            toast.error(`File ${file.name} was rejected`);
          });
        }

        if (
          onUpload &&
          updatedFiles.length > 0 &&
          updatedFiles.length <= maxFiles
        ) {
          const target =
            updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`;

          toast.promise(onUpload(updatedFiles), {
            loading: `Uploading ${target}...`,
            success: () => {
              setFiles([]);
              return `${target} uploaded`;
            },
            error: `Failed to upload ${target}`,
          });
        }
      },

      [files, maxFiles, multiple, onUpload, setFiles],
    );

    function onRemove(index: number) {
      if (!files) return;
      const newFiles = files.filter((_: any, i: number) => i !== index);
      setFiles(newFiles);
      onValueChange?.(newFiles);
    }

    // Revoke preview url when component unmounts
    React.useEffect(() => {
      return () => {
        if (!files) return;
        files.forEach((file: File) => {
          if (isFileWithPreview(file)) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isDisabled = disabled || (files?.length ?? 0) >= maxFiles;

    const dropzone = useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles,
      multiple,
      disabled: isDisabled,
      ...dropzoneProps,
    });

    return (
      <FileUploaderContext.Provider
        value={{
          files: files ?? [],
          maxFiles,
          maxSize,
          setFiles,
          onRemove,
          progresses: progresses ?? {},
          disabled: isDisabled,
          ...dropzone,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "relative flex flex-col gap-6 overflow-hidden",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  },
);
FileUploader.displayName = "FileUploader";

const FileUploaderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
});
FileUploaderContent.displayName = "FileUploaderContent";

const fileUploaderInputVariants = cva(
  "group relative cursor-pointer focus-visible:outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default:
          "grid h-52 w-full place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center ring-offset-background transition hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:border-muted-foreground/50",
        button:
          "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90",
        headless: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const FileUploaderTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof fileUploaderInputVariants>
>(({ children, className, variant, ...props }, ref) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    maxFiles,
    maxSize,
    disabled,
  } = useFileUploader();

  return (
    <div
      ref={ref}
      data-state={
        isDragActive
          ? "active"
          : isDragAccept
            ? "accept"
            : isDragReject
              ? "reject"
              : undefined
      }
      data-disabled={disabled ? "" : undefined}
      className={cn(fileUploaderInputVariants({ variant, className }))}
      {...props}
      {...getRootProps()}
    >
      <Input type="file" {...getInputProps()} />
      {isDragActive ? (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <UploadIcon
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="font-medium text-muted-foreground">
            Drop the files here
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <UploadIcon
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-px">
            <p className="font-medium text-muted-foreground">
              Drag {`'n'`} drop files here, or click to select files
            </p>
            <p className="text-sm text-muted-foreground/70">
              You can upload
              {maxFiles > 1
                ? ` ${maxFiles === Infinity ? "multiple" : maxFiles}
                      files (up to ${formatBytes(maxSize)} each)`
                : ` a file with ${formatBytes(maxSize)}`}
            </p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
});
FileUploaderTrigger.displayName = "FileUploaderTrigger";

interface FileUploaderItemProps extends React.HTMLAttributes<HTMLDivElement> {
  file: File;
  index: number;
  progress?: number;
}

const FileUploaderItem = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemProps
>(({ file, index, progress, className, ...props }, ref) => {
  const { onRemove } = useFileUploader();

  return (
    <div
      ref={ref}
      className={cn("relative flex items-center space-x-4", className)}
      {...props}
    >
      <div className="flex flex-1 space-x-4">
        {isFileWithPreview(file) ? (
          <img
            src={file.preview}
            alt={file.name}
            width={48}
            height={48}
            loading="lazy"
            className="aspect-square shrink-0 rounded-md object-cover"
          />
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <div className="space-y-px">
            <p className="line-clamp-1 text-sm font-medium text-foreground/80">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
          {progress ? <Progress value={progress} /> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => onRemove(index)}
        >
          <Cross2Icon className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    </div>
  );
});
FileUploaderItem.displayName = "FileUploaderItem";

export {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileUploaderTrigger,
};
