"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { SavingBar } from "@/components/saving-bar";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useUserQuery } from "@/hooks/use-user";

function EditableText({
  value,
  onChange,
  className,
  tag: Tag = "span",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tag?: "span" | "p" | "h2";
}) {
  const ref = useRef<HTMLElement>(null);
  const lastSavedValue = useRef(value);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
      lastSavedValue.current = value;
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    const text = ref.current?.textContent?.trim() || "";
    if (text !== lastSavedValue.current) {
      lastSavedValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none cursor-text ${className ?? ""}`}
    >
      {value}
    </Tag>
  );
}

export function EmailPreview() {
  const { emailPreview, setParams } = useInvoiceParams();
  const { watch, setValue } = useFormContext();
  const { data: user } = useUserQuery();
  const { updateTemplate } = useTemplateUpdate();

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

  // Display values — plain text, no template variable resolution
  const displaySubject = emailSubject || `${teamName} sent you an invoice`;
  const displayHeading = emailHeading || `Invoice from ${teamName}`;
  const displayBody =
    emailBody || "If you have any questions, just reply to this email.";
  const displayButtonText = emailButtonText || "View invoice";

  const [isSaving, setIsSaving] = useState(false);
  const savingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    setIsSaving(true);
    if (savingTimeout.current !== null) clearTimeout(savingTimeout.current);
    savingTimeout.current = setTimeout(() => setIsSaving(false), 600);
  };

  const handleClose = () => {
    setParams({ emailPreview: null });
  };

  const handleSubjectChange = (text: string) => {
    setValue("template.emailSubject", text, { shouldDirty: true });
    updateTemplate({ emailSubject: text });
    flashSaved();
  };

  const handleHeadingChange = (text: string) => {
    setValue("template.emailHeading", text, { shouldDirty: true });
    updateTemplate({ emailHeading: text });
    flashSaved();
  };

  const handleBodyChange = (text: string) => {
    setValue("template.emailBody", text, { shouldDirty: true });
    updateTemplate({ emailBody: text });
    flashSaved();
  };

  const handleButtonTextChange = (text: string) => {
    setValue("template.emailButtonText", text, { shouldDirty: true });
    updateTemplate({ emailButtonText: text });
    flashSaved();
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

              {/* Body */}
              <div className="text-[13px] text-[#606060] dark:text-[#878787] leading-relaxed mt-4">
                <EditableText
                  tag="p"
                  value={displayBody}
                  onChange={handleBodyChange}
                />
              </div>

              {/* Sign-off */}
              <p className="text-[13px] text-[#606060] dark:text-[#878787] leading-relaxed mt-4">
                Thanks,
                <br />
                {teamName}
              </p>
            </div>
          </div>

          {/* PDF attachment indicator */}
          {includePdf && (
            <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 border border-border">
              <Icons.Attachments className="size-4 text-[#878787]" />
              <span className="text-xs text-[#606060] dark:text-[#878787]">
                {invoiceNumber ? `invoice-${invoiceNumber}.pdf` : "invoice.pdf"}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-[11px] text-[#878787] mx-6 mb-6 text-center">
            This is the email your customer will receive. Labels, dates and
            currency are based on your invoice template. Click on any text to
            customize it.
          </p>
        </div>

        <SavingBar isPending={isSaving} />
      </SheetContent>
    </Sheet>
  );
}
