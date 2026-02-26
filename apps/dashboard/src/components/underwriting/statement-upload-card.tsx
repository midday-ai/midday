"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatementUploadCard({
  files,
  onFilesChange,
  onAnalyze,
  isAnalyzing,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, 10);
      onFilesChange(newFiles);
    },
    [files, onFilesChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    disabled: isAnalyzing,
  });

  return (
    <div className="border border-border/40 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-base font-medium">Bank Statements</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload 3-6 months of bank statements for analysis
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          isAnalyzing && "opacity-50 cursor-not-allowed",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Icons.ArrowUpward size={20} className="text-muted-foreground" />
          </div>
          {isDragActive ? (
            <p className="text-sm text-primary font-medium">
              Drop bank statements here
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Drop bank statement PDFs here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse — PDF files only, up to 10MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {files.length} file{files.length > 1 ? "s" : ""} uploaded
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icons.Description size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
                disabled={isAnalyzing}
              >
                <Icons.Close size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-4">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          disabled={files.length === 0 || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Statements"}
        </Button>
      </div>
    </div>
  );
}
