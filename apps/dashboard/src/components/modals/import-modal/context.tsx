import { createContext, useContext } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { z } from "zod";

export const mappableFields = {
  date: {
    label: "Date",
    required: true,
  },
  description: {
    label: "Description",
    required: true,
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

export const importSchema = z.object({
  file: z.custom<File>(),
  currency: z.string(),
  bank_account_id: z.string(),
  amount: z.string(),
  balance: z.string().optional(),
  date: z.string(),
  description: z.string(),
  inverted: z.boolean(),
  table: z.array(z.record(z.string(), z.string())).optional(),
  import_type: z.enum(["csv", "image"]),
});

export type ImportCsvFormData = {
  file: File | null;
  currency: string;
  bank_account_id: string;
  inverted: boolean;
  table: Record<string, string>[] | null;
  import_type: "csv" | "image";
} & Record<keyof typeof mappableFields, string>;

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
