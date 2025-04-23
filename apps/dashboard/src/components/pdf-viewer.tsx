"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@midday/ui/cn";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  maxWidth?: number;
}

export function PdfViewer({ url, maxWidth }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full overflow-hidden",
        numPages && "bg-white",
      )}
    >
      <ScrollArea className="w-full flex-1">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <Skeleton className="w-full h-[calc(100vh-theme(spacing.24))]" />
          }
        >
          {numPages &&
            Array.from(new Array(numPages), (_, index) => (
              <Page
                width={maxWidth}
                key={`${url}_${index + 1}`}
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={true}
              />
            ))}
        </Document>
      </ScrollArea>
    </div>
  );
}
