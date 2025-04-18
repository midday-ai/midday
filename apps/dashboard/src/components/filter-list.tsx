import { formatAccountName } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { formatDateRange } from "little-date";

const listVariant = {
  hidden: { y: 10, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.05,
      staggerChildren: 0.06,
    },
  },
};

const itemVariant = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

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
  | "status";

type FilterValue = {
  start: string;
  end: string;
  amount_range: string;
  attachments: string;
  recurring: string[];
  statuses: string[];
  categories: string[];
  tags: string[];
  accounts: string[];
  customers: string[];
  assignees: string[];
  owners: string[];
  status: string;
};

interface FilterValueProps {
  key: FilterKey;
  value: FilterValue[FilterKey];
}

interface Props {
  filters: Partial<FilterValue>;
  loading: boolean;
  onRemove: (filters: { [key: string]: null }) => void;
  categories?: { id: string; name: string; slug: string }[];
  accounts?: { id: string; name: string; currency: string }[];
  members?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
  statusFilters: { id: string; name: string }[];
  attachmentsFilters: { id: string; name: string }[];
  recurringFilters: { id: string; name: string }[];
  tags?: { id: string; name: string; slug?: string }[];
  amountRange?: [number, number];
}

export function FilterList({
  filters,
  loading,
  onRemove,
  categories,
  accounts,
  members,
  customers,
  tags,
  statusFilters,
  attachmentsFilters,
  recurringFilters,
  amountRange,
}: Props) {
  const renderFilter = ({ key, value }: FilterValueProps) => {
    switch (key) {
      case "start": {
        const startValue = value as FilterValue["start"];
        if (startValue && filters.end) {
          return formatDateRange(new Date(startValue), new Date(filters.end), {
            includeTime: false,
          });
        }

        return startValue && format(new Date(startValue), "MMM d, yyyy");
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
              statusFilters.find((filter) => filter.id === status)?.name,
          )
          .join(", ");
      }

      case "status": {
        const statusValue = value as FilterValue["status"];
        if (!statusValue) return null;
        return statusFilters.find((filter) => filter.id === statusValue)?.name;
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
    <motion.ul
      variants={listVariant}
      initial="hidden"
      animate="show"
      className="flex space-x-2"
    >
      {loading && (
        <div className="flex space-x-2">
          <motion.li key="1" variants={itemVariant}>
            <Skeleton className="rounded-full h-8 w-[100px]" />
          </motion.li>
          <motion.li key="2" variants={itemVariant}>
            <Skeleton className="rounded-full h-8 w-[100px]" />
          </motion.li>
        </div>
      )}

      {!loading &&
        Object.entries(filters)
          .filter(([key, value]) => value !== null && key !== "end")
          .map(([key, value]) => {
            const filterKey = key as FilterKey;
            return (
              <motion.li key={key} variants={itemVariant}>
                <Button
                  className="rounded-full h-8 px-3 bg-secondary hover:bg-secondary font-normal text-[#878787] flex space-x-1 items-center group"
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
              </motion.li>
            );
          })}
    </motion.ul>
  );
}
