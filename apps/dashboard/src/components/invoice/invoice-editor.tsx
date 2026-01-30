"use client";

import { useTRPC } from "@/trpc/client";
import type { BankAccountWithPaymentInfo } from "@midday/db/queries";
import { cn } from "@midday/ui/cn";
import {
  SlashCommand,
  type SlashCommandItem,
  SlashMenu,
  type SlashMenuRef,
} from "@midday/ui/editor/extentions/slash-command";
import { formatAmount } from "@midday/utils/format";
import { useQuery } from "@tanstack/react-query";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  EditorContent,
  type JSONContent,
  ReactRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import tippy, { type Instance } from "tippy.js";
import {
  formatBankPaymentDetails,
  formatBankPreview,
} from "./utils/format-bank-details";

type InvoiceEditorProps = {
  initialContent?: JSONContent;
  className?: string;
  onChange?: (content?: JSONContent | null) => void;
  onBlur?: (content: JSONContent | null) => void;
  placeholder?: string;
  disablePlaceholder?: boolean;
  tabIndex?: number;
};

export function InvoiceEditor({
  initialContent,
  className,
  onChange,
  onBlur,
  placeholder = "Type / to insert details",
  disablePlaceholder = false,
  tabIndex,
}: InvoiceEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState<JSONContent | null | undefined>(
    initialContent,
  );

  // Get tRPC client
  const trpc = useTRPC();

  // Get invoice form context
  const { watch } = useFormContext();
  const dueDate = watch("dueDate");
  const amount = watch("amount");
  const invoiceNumber = watch("invoiceNumber");
  const customerName = watch("customerName");
  const currency = watch("template.currency");
  const dateFormat = watch("template.dateFormat") || "MM/dd/yyyy";

  // Fetch bank accounts with payment info
  const { data: bankAccounts = [] } = useQuery({
    ...trpc.bankAccounts.getWithPaymentInfo.queryOptions(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Build slash command items based on available data
  const slashCommandItems = useMemo((): SlashCommandItem[] => {
    const items: SlashCommandItem[] = [];

    // Bank Account option with submenu (only if accounts exist)
    if (bankAccounts.length > 0) {
      items.push({
        id: "bank-account",
        label: "Bank Account",
        hasSubmenu: true,
        submenuItems: bankAccounts.map((account) => ({
          id: account.id,
          label: account.name,
          description: account.bankName || formatBankPreview(account),
          command: ({ editor, range }) => {
            const formattedDetails = formatBankPaymentDetails(account);
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(formattedDetails)
              .run();
          },
        })),
        command: () => {
          // No-op for parent - submenu handles it
        },
      });
    }

    // Due Date (use invoice's date format)
    items.push({
      id: "due-date",
      label: "Due Date",
      command: ({ editor, range }) => {
        const formattedDate = dueDate
          ? format(new Date(dueDate), dateFormat)
          : "";
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(formattedDate)
          .run();
      },
    });

    // Amount
    items.push({
      id: "amount",
      label: "Amount",
      command: ({ editor, range }) => {
        const formattedAmount =
          formatAmount({ amount: amount || 0, currency: currency || "USD" }) ||
          "";
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(formattedAmount)
          .run();
      },
    });

    // Invoice Number
    items.push({
      id: "invoice-number",
      label: "Invoice #",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(invoiceNumber || "")
          .run();
      },
    });

    // Customer Name (only show if customer is selected)
    if (customerName) {
      items.push({
        id: "customer",
        label: "Customer",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(customerName)
            .run();
        },
      });
    }

    return items;
  }, [
    bankAccounts,
    dueDate,
    dateFormat,
    amount,
    currency,
    invoiceNumber,
    customerName,
  ]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({ placeholder }),
      SlashCommand.configure({
        suggestion: {
          items: () => slashCommandItems,
          render: () => {
            let component: ReactRenderer<SlashMenuRef> | null = null;
            let popup: Instance[] | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props: {
                    ...props,
                    items: slashCommandItems,
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate: (props) => {
                component?.updateProps({
                  ...props,
                  items: slashCommandItems,
                });

                if (!props.clientRect) return;

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) ?? false;
              },

              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onBlur: () => {
      setIsFocused(false);
      if (content !== initialContent) {
        onBlur?.(content ?? null);
      }
      onBlur?.(content ?? null);
    },
    onFocus: () => setIsFocused(true),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const newIsEmpty = editor.state.doc.textContent.length === 0;
      setContent(newIsEmpty ? null : json);
      onChange?.(newIsEmpty ? null : json);
    },
  });

  const showStripedBackground = !disablePlaceholder && !content && !isFocused;

  if (!editor) return null;

  return (
    <div
      className={cn(
        // Hide placeholder text when not focused (TipTap placeholder uses ::before)
        !isFocused &&
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-['']",
      )}
    >
      <EditorContent
        editor={editor}
        className={cn(
          "text-[11px] text-primary leading-[18px] invoice-editor",
          showStripedBackground &&
            "w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
          className,
        )}
        tabIndex={tabIndex}
      />
    </div>
  );
}
