"use client";

import { isValidEmail, parseEmailList } from "@midday/utils";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../utils";
import { Badge } from "./badge";

export interface EmailTagInputProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EmailTagInput({
  value,
  onChange,
  placeholder = "Add email...",
  disabled,
  className,
}: EmailTagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Parse comma-separated emails from value
  const emails = React.useMemo(() => parseEmailList(value), [value]);

  const updateEmails = (newEmails: string[]) => {
    onChange?.(newEmails.length > 0 ? newEmails.join(", ") : null);
  };

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // Check if valid email
    if (!isValidEmail(trimmed)) return;

    // Check for duplicates
    if (emails.some((e) => e.toLowerCase() === trimmed)) return;

    updateEmails([...emails, trimmed]);
    setInputValue("");
  };

  const removeEmail = (emailToRemove: string) => {
    updateEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1]!);
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addEmail(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedEmails = pastedText
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => isValidEmail(e));

    if (pastedEmails.length > 0) {
      // Deduplicate within pasted emails and against existing emails
      const seen = new Set(emails.map((e) => e.toLowerCase()));
      const uniqueNewEmails: string[] = [];
      for (const email of pastedEmails) {
        if (!seen.has(email)) {
          seen.add(email);
          uniqueNewEmails.push(email);
        }
      }
      if (uniqueNewEmails.length > 0) {
        updateEmails([...emails, ...uniqueNewEmails]);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 border bg-transparent px-3 py-1 text-sm transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {emails.map((email) => (
        <Badge key={email} variant="tag" className="flex items-center gap-1">
          {email}
          {!disabled && (
            <button
              type="button"
              className="ml-0.5 outline-none hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Remove ${email}`}
            >
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="email"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={emails.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        autoComplete="off"
      />
    </div>
  );
}
