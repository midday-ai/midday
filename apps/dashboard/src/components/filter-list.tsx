import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { format, parseISO } from "date-fns";
import { formatDateRange } from "little-date";
import { formatAccountName } from "@/utils/format";

type FilterKey =
  | "start"
  | "end"
  | "amount_range"
  | "attachments"
  | "recurring"
  | "statuses"
  | "categories"
  | "tags"
  | "accounts"
  | "customers"
  | "assignees"
  | "owners"
  | "status"
  | "manual"
  | "type";

type FilterValue = {
  start: string;
  end: string;
  amount_range: string;
  attachments: string;
  recurring: string[] | boolean;
  statuses: string[];
  categories: string[];
  tags: string[];
  accounts: string[];
  customers: string[];
  assignees: string[];
  owners: string[];
  status: string;
  manual: string;
  type: "income" | "expense";
};

interface FilterValueProps {
  key: FilterKey;
  value: FilterValue[FilterKey];
}

interface Props {
  filters: Partial<FilterValue>;
  onRemove: (filters: { [key: string]: null }) => void;
  categories?: { id: string; name: string; slug: string | null }[];
  accounts?: { id: string; name: string; currency: string }[];
  members?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
  statusFilters?: { id: string; name: string }[];
  attachmentsFilters?: { id: string; name: string }[];
  recurringFilters?: { id: string; name: string }[];
  manualFilters?: { id: string; name: string }[];
  tags?: { id: string; name: string; slug?: string }[];
  amountRange?: [number, number];
}

export function FilterList({
  filters,
  onRemove,
  categories,
  accounts,
  members,
  customers,
  tags,
  statusFilters,
  attachmentsFilters,
  recurringFilters,
  manualFilters,
  amountRange,
}: Props) {
  const renderFilter = ({ key, value }: FilterValueProps) => {
    switch (key) {
      case "start": {
        const startValue = value as FilterValue["start"];
        if (startValue && filters.end) {
          return formatDateRange(parseISO(startValue), parseISO(filters.end), {
            includeTime: false,
          });
        }

        return startValue && format(parseISO(startValue), "MMM d, yyyy");
      }

      case "amount_range": {
        return `${amountRange?.[0]?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} - ${amountRange?.[1]?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }

      case "attachments": {
        const attachmentValue = value as FilterValue["attachments"];
        return attachmentsFilters?.find(
          (filter) => filter.id === attachmentValue,
        )?.name;
      }

      case "recurring": {
        const recurringValue = value as FilterValue["recurring"];
        // Handle boolean for invoice filters
        if (typeof recurringValue === "boolean") {
          return recurringValue ? "Recurring" : "One-time";
        }
        // Handle string array for transaction filters
        return recurringValue
          ?.map(
            (slug) =>
              recurringFilters?.find((filter) => filter.id === slug)?.name,
          )
          .join(", ");
      }

      case "statuses": {
        const statusesValue = value as FilterValue["statuses"];
        if (!statusesValue) return null;
        return statusesValue
          .map(
            (status) =>
              statusFilters?.find((filter) => filter.id === status)?.name,
          )
          .join(", ");
      }

      case "status": {
        const statusValue = value as FilterValue["status"];
        if (!statusValue) return null;
        return statusFilters?.find((filter) => filter.id === statusValue)?.name;
      }

      case "categories": {
        const categoriesValue = value as FilterValue["categories"];
        if (!categoriesValue) return null;
        return categoriesValue
          .map(
            (slug) =>
              categories?.find((category) => category.slug === slug)?.name,
          )
          .join(", ");
      }

      case "tags": {
        const tagsValue = value as FilterValue["tags"];
        if (!tagsValue) return null;
        return tagsValue
          .map(
            (id) =>
              tags?.find((tag) => tag?.id === id || tag?.slug === id)?.name,
          )
          .join(", ");
      }

      case "accounts": {
        const accountsValue = value as FilterValue["accounts"];
        if (!accountsValue) return null;
        return accountsValue
          .map((id) => {
            const account = accounts?.find((account) => account.id === id);
            return formatAccountName({
              name: account?.name,
              currency: account?.currency,
            });
          })
          .join(", ");
      }

      case "customers": {
        const customersValue = value as FilterValue["customers"];
        if (!customersValue) return null;
        return customersValue
          .map((id) => customers?.find((customer) => customer.id === id)?.name)
          .join(", ");
      }

      case "assignees":
      case "owners": {
        const membersValue = value as FilterValue["assignees"];
        if (!membersValue) return null;
        return membersValue
          .map((id) => {
            const member = members?.find((member) => member.id === id);
            return member?.name;
          })
          .join(", ");
      }

      case "manual": {
        const manualValue = value as FilterValue["manual"];
        return manualFilters?.find((filter) => filter.id === manualValue)?.name;
      }

      case "type": {
        const typeValue = value as FilterValue["type"];
        if (typeValue === "income") return "In";
        if (typeValue === "expense") return "Out";
        return null;
      }

      default:
        return null;
    }
  };

  const handleOnRemove = (key: FilterKey) => {
    if (key === "start" || key === "end") {
      onRemove({ start: null, end: null });
      return;
    }

    onRemove({ [key]: null });
  };

  return (
    <ul className="flex space-x-2">
      {Object.entries(filters)
        .filter(([key, value]) => value !== null && key !== "end")
        .map(([key, value]) => {
          const filterKey = key as FilterKey;
          return (
            <li key={key}>
              <Button
                className="h-9 px-2 bg-secondary hover:bg-secondary font-normal text-[#878787] flex space-x-1 items-center group rounded-none"
                onClick={() => handleOnRemove(filterKey)}
              >
                <Icons.Clear className="scale-0 group-hover:scale-100 transition-all w-0 group-hover:w-4" />
                <span>
                  {renderFilter({
                    key: filterKey,
                    value: value as FilterValue[FilterKey],
                  })}
                </span>
              </Button>
            </li>
          );
        })}
    </ul>
  );
}
