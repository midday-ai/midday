import { createContext, useContext } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

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
} as const;

export type ImportCsvFormData = {
  file: File | null;
  currency: string;
  bank_account_id: string;
} & Record<keyof typeof mappableFields & { category_slug: string }, string>;

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
