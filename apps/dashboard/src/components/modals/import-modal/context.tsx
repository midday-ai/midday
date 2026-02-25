import { createContext, useContext } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { z } from "zod/v3";

export const mappableFields = {
  date: {
    label: "Date",
    required: true,
  },
  description: {
    label: "Description",
    required: false,
  },
  counterparty: {
    label: "From / To",
    required: false,
  },
  amount: {
    label: "Amount",
    required: true,
  },
  balance: {
    label: "Balance",
    required: false,
  },
} as const;

export const importSchema = z
  .object({
    file: z.custom<File>(),
    currency: z.string(),
    bank_account_id: z.string(),
    amount: z.string(),
    balance: z.string().optional(),
    date: z.string(),
    description: z.string().optional(),
    counterparty: z.string().optional(),
    inverted: z.boolean(),
    table: z.array(z.record(z.string(), z.string())).optional(),
  })
  .refine((data) => !!data.description || !!data.counterparty, {
    message: "Either Description or From / To is required",
    path: ["description"],
  });

export type ImportCsvFormData = {
  file: File;
  currency: string;
  bank_account_id: string;
  amount: string;
  balance?: string;
  date: string;
  description?: string;
  counterparty?: string;
  inverted: boolean;
  table?: Record<string, string>[];
};

export const ImportCsvContext = createContext<{
  fileColumns: string[] | null;
  setFileColumns: (columns: string[] | null) => void;
  firstRows: Record<string, string>[] | null;
  setFirstRows: (rows: Record<string, string>[] | null) => void;
  control: Control<ImportCsvFormData>;
  watch: UseFormWatch<ImportCsvFormData>;
  setValue: UseFormSetValue<ImportCsvFormData>;
} | null>(null);

export function useCsvContext() {
  const context = useContext(ImportCsvContext);

  if (!context)
    throw new Error(
      "useCsvContext must be used within an ImportCsvContext.Provider",
    );

  return context;
}
