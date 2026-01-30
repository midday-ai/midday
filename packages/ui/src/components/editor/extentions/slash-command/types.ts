import type { Editor, Range } from "@tiptap/react";
import type React from "react";

export type SlashCommandItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
  // For items with submenus (like Bank Account)
  hasSubmenu?: boolean;
  submenuItems?: SlashCommandSubItem[];
};

export type SlashCommandSubItem = {
  id: string;
  label: string;
  description?: string;
  command: (props: { editor: Editor; range: Range }) => void;
};

export type SlashCommandContext = {
  // Invoice data for dynamic inserts
  dueDate?: string;
  amount?: string;
  invoiceNumber?: string;
  customerName?: string;
  // Bank accounts with payment info
  bankAccounts?: BankAccountForSlashCommand[];
};

export type BankAccountForSlashCommand = {
  id: string;
  name: string;
  bankName: string | null;
  // Formatted payment details ready to insert
  formattedDetails: string;
};
