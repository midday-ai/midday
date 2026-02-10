"use client";

import { useState } from "react";
import { Document, Page, PasswordResponses, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  maxWidth?: number;
}

export function PdfViewer({ url, maxWidth }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordCancelled, setPasswordCancelled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(
    null,
  );
  const [pendingCallback, setPendingCallback] = useState<
    ((password: string | null) => void) | null
  >(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setIsPasswordProtected(false);
    setPasswordCancelled(false);
    setPassword("");
    setPasswordError("");
    setIsSubmittingPassword(false);
    setSubmittedPassword(null);
    setPendingCallback(null);
  }

  function onDocumentLoadError(error: Error): void {
    // Check if it's a password-related error
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes("password") ||
      errorMessage.includes("encrypted")
    ) {
      setIsPasswordProtected(true);
    }
  }

  function onPassword(
    callback: (password: string | null) => void,
    reason: number,
  ): void {
    switch (reason) {
      case PasswordResponses.NEED_PASSWORD: {
        // If we already submitted a password, use it immediately
        if (submittedPassword) {
          callback(submittedPassword);
          return;
        }

        // First time asking for password - show the form
        setPendingCallback(() => callback);
        setIsPasswordProtected(true);
        setPasswordError("");
        break;
      }
      case PasswordResponses.INCORRECT_PASSWORD: {
        setPendingCallback(() => callback);
        setPasswordError("Invalid password. Please try again.");
        setIsSubmittingPassword(false);
        setIsPasswordProtected(true);
        setSubmittedPassword(null); // Clear the submitted password
        break;
      }
      default:
        callback(null);
    }
  }

  function handlePasswordSubmit() {
    if (pendingCallback && password.trim()) {
      setIsSubmittingPassword(true);
      setPasswordError("");
      setIsPasswordProtected(false); // Hide the password form while loading
      setSubmittedPassword(password); // Store the password for potential reuse
      pendingCallback(password);
    }
  }

  function _handlePasswordCancel() {
    if (pendingCallback) {
      pendingCallback(null);
      setPasswordCancelled(true);
    }
    setPassword("");
    setPasswordError("");
  }

  // Show password protection message if PDF is password protected and user cancelled
  if (isPasswordProtected && passwordCancelled) {
    return (
      <div className="flex flex-col w-full h-full overflow-hidden items-center justify-center p-8">
        <Alert className="max-w-md">
          <AlertDescription>
            This PDF is password protected and cannot be viewed without the
            correct password.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = !numPages && !isPasswordProtected;

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full overflow-hidden relative",
        numPages && "bg-white",
      )}
    >
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}

      {isPasswordProtected && !isSubmittingPassword ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-1">
              <h3 className="text-[#878787]">
                This document is password protected.
              </h3>
              <p className="text-xs text-[#878787]">
                Please enter the password below.
              </p>
            </div>
            <div className="space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePasswordSubmit();
                }}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              >
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password.trim()) {
                      handlePasswordSubmit();
                    }
                  }}
                  disabled={isSubmittingPassword}
                  autoComplete="one-time-code"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bitwarden-watching="false"
                  name="document-unlock-password"
                  className="text-center bg-transparent focus:ring-0 focus:outline-none"
                />
              </form>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={2}
          doubleClick={{ mode: "toggle", step: 1 }}
          panning={{ disabled: false }}
          wheel={{ wheelDisabled: true, touchPadDisabled: false, step: 0.5 }}
          pinch={{ step: 5 }}
          alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
            contentStyle={{
              cursor: "grab",
            }}
            wrapperClass="[&:active]:cursor-grabbing"
          >
            <div className="pb-24">
              <Document
                key={`${url}_${isPasswordProtected}`}
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onPassword={onPassword}
                loading={
                  <Skeleton className="w-full h-[calc(100vh-theme(spacing.24))]" />
                }
                error={
                  <div className="flex flex-col items-center justify-center h-full w-full gap-2 text-muted-foreground">
                    <Icons.BrokenImage className="size-8" />
                    <p className="text-sm">File not found</p>
                  </div>
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
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  );
}
