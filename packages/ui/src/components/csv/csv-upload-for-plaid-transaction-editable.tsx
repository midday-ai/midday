import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { ReactSpreadsheetImport } from "react-spreadsheet-import";
import { Fields, Result } from "react-spreadsheet-import/types/types";

import { cn } from "../../utils/cn";
import { Button } from "../button";

export interface EditableCsvUploaderForPlaidTransactions {
  onSubmit: (data: Result<string>, file: File) => void;
  fields: Array<Fields<string>>;
  className?: string;
}

export const transactionDataFields: Array<Fields<string>> = [
  {
    label: "Amount",
    key: "amount",
    alternateMatches: ["transaction amount", "price"],
    fieldType: {
      type: "input",
    },
    example: "100.00",
    validations: [
      {
        rule: "required",
        errorMessage: "Amount is required",
        level: "error",
      },
      {
        rule: "regex",
        errorMessage: "Invalid amount format",
        level: "error",
        validationPattern: "^\\d+(\\.\\d{1,2})?$", // Validates a number with up to two decimal places
      },
    ],
  },
  {
    label: "Description",
    key: "description",
    alternateMatches: ["desc", "transaction description"],
    fieldType: {
      type: "input",
    },
    example: "Payment for services rendered",
    validations: [
      {
        rule: "required",
        errorMessage: "Description is required",
        level: "error",
      },
    ],
  },
  {
    label: "Date",
    key: "date",
    alternateMatches: ["transaction date", "date of transaction"],
    fieldType: {
      type: "input",
    },
    example: "2021-12-01",
    validations: [
      {
        rule: "required",
        errorMessage: "Date is required",
        level: "error",
      },
      {
        rule: "regex",
        errorMessage: "Invalid date format",
        level: "error",
        validationPattern: "^\\d{4}-\\d{2}-\\d{2}$", // YYYY-MM-DD format
      },
    ],
  },
  {
    label: "Merchant",
    key: "merchant",
    alternateMatches: ["vendor", "store"],
    fieldType: {
      type: "input",
    },
    example: "Acme Corp",
    validations: [
      {
        rule: "required",
        errorMessage: "Merchant is required",
        level: "error",
      },
    ],
  },
  {
    label: "Category",
    key: "category",
    alternateMatches: ["type", "transaction type"],
    fieldType: {
      type: "select",
      options: ["Food", "Travel", "Healthcare", "Entertainment", "Other"], // Example categories
    },
    example: "Travel",
    validations: [
      {
        rule: "required",
        errorMessage: "Category is required",
        level: "info",
      },
    ],
  },
  {
    label: "City",
    key: "city",
    alternateMatches: ["location", "place"],
    fieldType: {
      type: "input",
    },
    example: "New York City",
    validations: [
      {
        rule: "required",
        errorMessage: "City is required",
        level: "info",
      },
    ],
  },
];

/**
 * Component for uploading and processing CSV files. It uses the
 * `react-csv-importer` library to handle file input, parsing, and processing in
 * chunks.
 *
 * @example
 *   return <EditableCsvUploaderForPlaidTransactions />
 *
 * @component
 */
export const EditableCsvUploaderForPlaidTransactions: React.FC<
  EditableCsvUploaderForPlaidTransactions
> = ({ onSubmit, className, fields = transactionDataFields }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn("flex flex-1 gap-2", className)}
      >
        Open CSV Importer
        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
      </Button>
      <ReactSpreadsheetImport
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={onSubmit}
        fields={fields}
        customTheme={{
          colors: {
            background: "white",
          },
          components: {
            Button: {
              baseStyle: {
                borderRadius: "4px",
              },
              defaultProps: {
                colorScheme: "black",
              },
            },
            UploadStep: {
              baseStyle: {
                dropzoneButton: {
                  bg: "black",
                },
              },
            },
          },
        }}
      />
    </div>
  );
};
