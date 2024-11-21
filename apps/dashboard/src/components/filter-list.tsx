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

type Props = {
  filters: { [key: string]: string | number | boolean | string[] | number[] };
  loading: boolean;
  onRemove: (key: string) => void;
  categories?: { id: string; name: string; slug: string }[];
  accounts?: { id: string; name: string; currency: string }[];
  members?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
  statusFilters: { id: string; name: string }[];
  attachmentsFilters: { id: string; name: string }[];
  recurringFilters: { id: string; name: string }[];
  tags?: { id: string; name: string; slug?: string }[];
  amountRange?: [number, number];
};

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
  const renderFilter = ({ key, value }) => {
    switch (key) {
      case "start": {
        if (key === "start" && value && filters.end) {
          return formatDateRange(new Date(value), new Date(filters.end), {
            includeTime: false,
          });
        }

        return (
          key === "start" && value && format(new Date(value), "MMM d, yyyy")
        );
      }

      case "amount_range": {
        return `${amountRange?.[0]} - ${amountRange?.[1]}`;
      }

      case "attachments": {
        return attachmentsFilters?.find((filter) => filter.id === value)?.name;
      }

      case "recurring": {
        return value
          ?.map(
            (slug) =>
              recurringFilters?.find((filter) => filter.id === slug)?.name,
          )
          .join(", ");
      }

      case "statuses": {
        return value
          .map(
            (status) =>
              statusFilters.find((filter) => filter.id === status)?.name,
          )
          .join(", ");
      }

      case "categories": {
        return value
          .map(
            (slug) =>
              categories?.find((category) => category.slug === slug)?.name,
          )
          .join(", ");
      }

      case "tags": {
        return value
          .map(
            (id) =>
              tags?.find((tag) => tag?.id === id || tag?.slug === id)?.name,
          )
          .join(", ");
      }

      case "accounts": {
        return value
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
        return value
          .map((id) => customers?.find((customer) => customer.id === id)?.name)
          .join(", ");
      }

      case "assignees":
      case "owners": {
        return value
          .map((id) => {
            const member = members?.find((member) => member.id === id);
            return member?.name;
          })
          .join(", ");
      }

      case "q":
        return value;

      default:
        return null;
    }
  };

  const handleOnRemove = (key: string) => {
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
            return (
              <motion.li key={key} variants={itemVariant}>
                <Button
                  className="rounded-full h-8 px-3 bg-secondary hover:bg-secondary font-normal text-[#878787] flex space-x-1 items-center group"
                  onClick={() => handleOnRemove(key)}
                >
                  <Icons.Clear className="scale-0 group-hover:scale-100 transition-all w-0 group-hover:w-4" />
                  <span>
                    {renderFilter({
                      key,
                      value,
                    })}
                  </span>
                </Button>
              </motion.li>
            );
          })}
    </motion.ul>
  );
}
