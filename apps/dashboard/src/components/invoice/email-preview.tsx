"use client";

import {
  DEFAULT_EMAIL_BUTTON_TEXT,
  defaultEmailBody,
  defaultEmailHeading,
  defaultEmailSubject,
} from "@midday/email/defaults";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import { format } from "date-fns";
import { useCallback, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { SavingBar } from "@/components/saving-bar";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";

/** Single-line inline editable text (contentEditable — ideal for span/h2). */
function EditableText({
  value,
  onChange,
  className,
  tag: Tag = "span",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tag?: "span" | "p" | "h2" | "div";
}) {
  const ref = useRef<HTMLElement>(null);
  const lastSavedValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
      lastSavedValue.current = value;
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const text = ref.current.textContent?.trim() || "";
    if (text !== lastSavedValue.current) {
      lastSavedValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none cursor-text ${className ?? ""}`}
    />
  );
}

/** Multiline editable text using a plain <textarea> — handles newlines natively. */
function EditableMultilineText({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lastSavedValue = useRef(value);

  // Auto-resize to fit content
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Sync value from props and resize to fit content
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.value !== value) {
      ref.current.value = value;
      lastSavedValue.current = value;
    }
    // Always resize — on mount the value is already set via defaultValue
    // so the comparison above is false, but the textarea still needs
    // to expand beyond rows={1} to show all its content.
    resize();
  }, [value, resize]);

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const text = ref.current.value.replace(/\n{3,}/g, "\n\n").trim();
    if (text !== lastSavedValue.current) {
      lastSavedValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    resize();
  }, [resize]);

  return (
    <textarea
      ref={ref}
      defaultValue={value}
      onBlur={handleBlur}
      onInput={handleInput}
      rows={1}
      className={`outline-none cursor-text resize-none w-full bg-transparent overflow-hidden ${className ?? ""}`}
    />
  );
}

export function EmailPreview() {
  const { emailPreview, setParams } = useInvoiceParams();
  const { watch, setValue } = useFormContext();
  const { data: user } = useUserQuery();
  const { updateTemplate, isPending, isError } = useTemplateUpdate();

  const isOpen = emailPreview === true;

  const teamName = user?.team?.name ?? "Your Company";
  const customerName = watch("customerName") || "Customer";
  const invoiceLogoUrl = watch("template.logoUrl") as string | null;
  const invoiceNumber = watch("invoiceNumber") as string | null;
  const amount = watch("amount") as number | null;
  const currency = (watch("template.currency") as string) || "USD";
  const locale = (watch("template.locale") as string) || "en-US";
  const dateFormat = (watch("template.dateFormat") as string) || "MM/dd/yyyy";
  const dueDate = watch("dueDate") as string | null;
  const dueDateLabel = (watch("template.dueDateLabel") as string) || "Due";
  const invoiceNoLabel =
    (watch("template.invoiceNoLabel") as string) || "Invoice";
  const includePdf = watch("template.includePdf") as boolean;
  const token = watch("token") as string | null;

  const emailSubject = watch("template.emailSubject") as string | null;
  const emailHeading = watch("template.emailHeading") as string | null;
  const emailBody = watch("template.emailBody") as string | null;
  const emailButtonText = watch("template.emailButtonText") as string | null;

  const formattedAmount =
    amount != null
      ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(
          amount,
        )
      : null;

  let formattedDueDate: string | null = null;
  if (dueDate) {
    try {
      formattedDueDate = format(new Date(dueDate), dateFormat);
    } catch {
      formattedDueDate = dueDate;
    }
  }

  // Display values — plain text, no template variable resolution.
  // Defaults are imported from @midday/email/defaults so they stay in sync
  // with the actual email template the customer receives.
  const displaySubject = emailSubject || defaultEmailSubject(teamName);
  const displayHeading = emailHeading || defaultEmailHeading(teamName);
  const displayBody = emailBody || defaultEmailBody(teamName);
  const displayButtonText = emailButtonText || DEFAULT_EMAIL_BUTTON_TEXT;

  const handleClose = () => {
    setParams({ emailPreview: null });
  };

  const handleSubjectChange = (text: string) => {
    setValue("template.emailSubject", text, { shouldDirty: true });
    updateTemplate({ emailSubject: text });
  };

  const handleHeadingChange = (text: string) => {
    setValue("template.emailHeading", text, { shouldDirty: true });
    updateTemplate({ emailHeading: text });
  };

  const handleBodyChange = (text: string) => {
    setValue("template.emailBody", text, { shouldDirty: true });
    updateTemplate({ emailBody: text });
  };

  const handleButtonTextChange = (text: string) => {
    setValue("template.emailButtonText", text, { shouldDirty: true });
    updateTemplate({ emailButtonText: text });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        stack
        style={{ maxWidth: 580 }}
        className="bg-white dark:bg-[#080808] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Email Preview</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="p-0 m-0 size-auto hover:bg-transparent"
            type="button"
          >
            <Icons.Close className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col overflow-y-auto h-[calc(100%-53px)]">
          <div className="p-6 pb-4 shrink-0">
            {/* Sender info */}
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border border-border flex items-center justify-center flex-shrink-0">
                <img
                  src="https://midday.ai/email/logo.png"
                  alt="Midday"
                  className="size-6 dark:invert dark:brightness-100"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  <EditableText
                    value={displaySubject}
                    onChange={handleSubjectChange}
                  />
                </div>
                <div className="text-xs text-[#878787]">to {customerName}</div>
              </div>
            </div>
          </div>

          {/* Email body card — fills remaining space */}
          <div className="flex-1 mx-6 mb-6 border border-border bg-[#fcfcfc] dark:bg-[#0f0f0f]">
            <div className="p-10">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                {invoiceLogoUrl ? (
                  <img
                    src={invoiceLogoUrl}
                    alt={teamName}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <img
                    src="https://midday.ai/email/logo.png"
                    alt="Midday"
                    className="h-10 w-10 dark:invert dark:brightness-100"
                  />
                )}
              </div>

              {/* Heading */}
              <h2 className="text-[21px] font-normal text-center text-[#0e0e0e] dark:text-[#fefefe] mb-[30px]">
                <EditableText
                  tag="span"
                  value={displayHeading}
                  onChange={handleHeadingChange}
                />
              </h2>

              {/* Amount */}
              {formattedAmount && (
                <p className="text-[32px] font-normal text-center text-[#0e0e0e] dark:text-[#fefefe] m-0">
                  {formattedAmount}
                </p>
              )}

              {/* Due date & invoice number */}
              {(formattedDueDate || invoiceNumber) && (
                <div className="text-center mt-2">
                  {formattedDueDate && (
                    <p className="text-[14px] text-[#606060] dark:text-[#878787] m-0">
                      {dueDateLabel} {formattedDueDate}
                    </p>
                  )}
                  {invoiceNumber && (
                    <p className="text-[13px] text-[#606060] dark:text-[#878787] m-0">
                      {invoiceNoLabel} #{invoiceNumber}
                    </p>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <div className="text-center mt-[40px] mb-[40px]">
                <span className="inline-block border border-[#0e0e0e] dark:border-[#fefefe] text-[#0e0e0e] dark:text-[#fefefe] px-6 py-3 text-sm font-medium no-underline">
                  <EditableText
                    value={displayButtonText}
                    onChange={handleButtonTextChange}
                  />
                </span>
              </div>

              {/* Divider */}
              <hr className="border-t border-border my-0" />

              {/* Body & sign-off */}
              <EditableMultilineText
                value={displayBody}
                onChange={handleBodyChange}
                className="text-[13px] text-[#606060] dark:text-[#878787] leading-relaxed mt-4"
              />
            </div>
          </div>

          {/* PDF attachment indicator */}
          {includePdf && (
            <button
              type="button"
              onClick={() => {
                if (!token) return;
                const filename = invoiceNumber
                  ? `invoice-${invoiceNumber}.pdf`
                  : "invoice.pdf";
                downloadFile(
                  `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${token}`,
                  filename,
                );
              }}
              className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-auto"
            >
              <Icons.Attachments className="size-4 text-[#878787]" />
              <span className="text-xs text-[#606060] dark:text-[#878787]">
                {invoiceNumber ? `invoice-${invoiceNumber}.pdf` : "invoice.pdf"}
              </span>
            </button>
          )}

          {/* Description */}
          <p className="text-[11px] text-[#878787] mx-6 mb-6 text-center">
            This is the email your customer will receive. Labels, dates and
            currency are based on your invoice template. Click on any text to
            customize it.
          </p>
        </div>

        <SavingBar isPending={isPending} isError={isError} />
      </SheetContent>
    </Sheet>
  );
}
