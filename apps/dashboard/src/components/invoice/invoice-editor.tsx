"use client";

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
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import tippy, { type Instance } from "tippy.js";
import { useTRPC } from "@/trpc/client";
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
  const [isEmpty, setIsEmpty] = useState(!initialContent);

  // Refs to avoid stale closures in TipTap callbacks
  const contentRef = useRef<JSONContent | null>(initialContent ?? null);
  const onBlurRef = useRef(onBlur);
  const onChangeRef = useRef(onChange);
  onBlurRef.current = onBlur;
  onChangeRef.current = onChange;

  // Get tRPC client and form context
  const trpc = useTRPC();
  const { control } = useFormContext();

  // Watch form values for slash commands (useWatch triggers re-renders)
  const dueDate = useWatch({ control, name: "dueDate" });
  const amount = useWatch({ control, name: "amount" });
  const invoiceNumber = useWatch({ control, name: "invoiceNumber" });
  const customerName = useWatch({ control, name: "customerName" });
  const currency = useWatch({ control, name: "template.currency" });
  const dateFormat =
    useWatch({ control, name: "template.dateFormat" }) || "MM/dd/yyyy";

  // Fetch bank accounts with payment info
  const { data: bankAccounts = [] } = useQuery({
    ...trpc.bankAccounts.getWithPaymentInfo.queryOptions(),
    staleTime: 1000 * 60 * 5,
  });

  // Build slash command items
  const slashCommandItems = useMemo((): SlashCommandItem[] => {
    const items: SlashCommandItem[] = [];

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
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(formatBankPaymentDetails(account))
              .run();
          },
        })),
        command: () => {},
      });
    }

    items.push({
      id: "due-date",
      label: "Due Date",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(dueDate ? format(new Date(dueDate), dateFormat) : "")
          .run();
      },
    });

    items.push({
      id: "amount",
      label: "Amount",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(
            formatAmount({
              amount: amount || 0,
              currency: currency || "USD",
            }) || "",
          )
          .run();
      },
    });

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

  // Ref for slash commands (updated synchronously to avoid race conditions)
  const slashCommandItemsRef = useRef(slashCommandItems);
  slashCommandItemsRef.current = slashCommandItems;

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
          items: () => slashCommandItemsRef.current,
          render: () => {
            let component: ReactRenderer<SlashMenuRef> | null = null;
            let popup: Instance[] | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props: { ...props, items: slashCommandItemsRef.current },
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
                  items: slashCommandItemsRef.current,
                });
                if (props.clientRect) {
                  popup?.[0]?.setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                  });
                }
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  // Delegate to SlashMenu first (e.g., to close submenu only)
                  const handled = component?.ref?.onKeyDown(props) ?? false;
                  if (!handled) {
                    // SlashMenu didn't handle it (no submenu open), close entire popup
                    popup?.[0]?.hide();
                  }
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
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      onBlurRef.current?.(contentRef.current);
    },
    onUpdate: ({ editor }) => {
      const newIsEmpty = editor.state.doc.textContent.length === 0;
      const newContent = newIsEmpty ? null : editor.getJSON();
      contentRef.current = newContent;
      setIsEmpty(newIsEmpty);
      onChangeRef.current?.(newContent);
    },
  });

  // Sync editor when initialContent prop changes (e.g., form reloads fresh data)
  useEffect(() => {
    if (!editor || editor.isFocused) return;

    const editorIsEmpty = editor.state.doc.textContent.length === 0;
    const newIsEmpty = !initialContent;

    // Skip if both empty
    if (editorIsEmpty && newIsEmpty) return;

    // Update if empty state differs or content differs
    if (
      editorIsEmpty !== newIsEmpty ||
      JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)
    ) {
      editor.commands.setContent(initialContent ?? "");
      contentRef.current = initialContent ?? null;
      setIsEmpty(newIsEmpty);
    }
  }, [initialContent, editor]);

  const showStripedBackground = !disablePlaceholder && isEmpty && !isFocused;

  if (!editor) return null;

  return (
    <div
      className={cn(
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
