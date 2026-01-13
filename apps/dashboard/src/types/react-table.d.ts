import type { RouterOutputs } from "@/trpc/client";
import type { Dispatch, SetStateAction } from "react";

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    // Transaction table meta
    dateFormat?: string | null;
    timeFormat?: number | null;
    hasSorting?: boolean;
    setOpen?: (id: string) => void;
    copyUrl?: (id: string) => void;
    updateTransaction?: (data: {
      id: string;
      status?: string;
      categorySlug?: string | null;
      categoryName?: string;
      assignedId?: string | null;
    }) => void;
    onDeleteTransaction?: (id: string) => void;
    moveToReview?: (id: string) => void;
    editTransaction?: (id: string) => void;
    lastClickedIndex?: number | null;
    setLastClickedIndex?: (index: number | null) => void;
    handleShiftClickRange?: (startIndex: number, endIndex: number) => void;
    exportingTransactionIds?: string[];

    // Vault table meta
    handleDelete?: (id: string) => void;
    handleShare?: (pathTokens: string[]) => void;
    handleReprocess?: (id: string) => void;

    // Categories table meta
    deleteCategory?: (id: string) => void;
    onEdit?: (id: string) => void;
    expandedCategories?: Set<string>;
    setExpandedCategories?: Dispatch<SetStateAction<Set<string>>>;
    searchValue?: string;
    setSearchValue?: Dispatch<SetStateAction<string>>;

    // Customers table meta
    deleteCustomer?: (id: string) => void;
    enrichCustomer?: (id: string) => void;

    // Products table meta
    onEdit?: (id: string) => void;

    // Members table meta
    currentUser?: RouterOutputs["team"]["members"][number];
    totalOwners?: number;
  }

  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    sticky?: boolean;
    sortField?: string;
    /** Skeleton configuration for loading states */
    skeleton?: {
      type:
        | "checkbox"
        | "text"
        | "avatar-text"
        | "icon-text"
        | "badge"
        | "tags"
        | "icon";
      width?: string;
    };
    /** Header label for skeleton headers */
    headerLabel?: string;
  }
}
