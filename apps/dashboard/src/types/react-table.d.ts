import type { RouterOutputs } from "@/trpc/client";

declare module "@tanstack/table-core" {
	interface TableMeta extends RowData {
		// Transaction table meta
		dateFormat?: string | null;
		hasSorting?: boolean;
		setOpen?: (id: string) => void;
		copyUrl?: (id: string) => void;
		updateTransaction?: (data: { id: string; status: string }) => void;
		onDeleteTransaction?: (id: string) => void;

		// Vault table meta
		handleDelete?: (id: string) => void;
		handleShare?: (pathTokens: string[]) => void;

		// Categories table meta
		deleteCategory?: (id: string) => void;
		expandedCategories?: Set<string>;
		setExpandedCategories?: React.Dispatch<React.SetStateAction<Set<string>>>;

		// Customers table meta
		deleteCustomer?: (id: string) => void;

		// Members table meta
		currentUser?: RouterOutputs["team"]["members"][number];
		totalOwners?: number;
	}

	interface ColumnMeta extends RowData, TValue {
		className?: string;
	}
}
