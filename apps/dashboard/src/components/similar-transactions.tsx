"use client";

import { Tables } from "@midday/supabase/types";
import { Badge } from "@midday/ui/badge";
import { Button, buttonVariants } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Input } from "@midday/ui/input";
import { formatDate } from "@midday/ui/lib/converters/date-formater";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { FilterIcon, ListOrderedIcon, SearchIcon } from "lucide-react";
import React, { useMemo, useState } from "react";

type Transaction = Tables<"transactions">;

interface SimilarTransactionsProps {
  similarTransactions: Transaction[];
  title: string;
}

const SimilarTransactions: React.FC<SimilarTransactionsProps> = ({
  similarTransactions,
  title,
}) => {
  return (
    <div className="bg-background rounded-lg shadow-md overflow-y-auto scrollbar-hide">
      <TransactionsFilterHelper
        transactions={similarTransactions}
        title={title}
      />
    </div>
  );
};

export const TransactionsFilterHelper: React.FC<{
  transactions: Array<Transaction>;
  title: string;
}> = ({ transactions, title }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterCategory, setFilterCategory] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) =>
        transaction.merchant_name?.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((transaction) =>
        filterCategory ? transaction.category_slug === filterCategory : true,
      )
      .sort((a, b) => {
        if (sortBy === "date") {
          return sortDirection === "asc"
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === "amount") {
          return sortDirection === "asc"
            ? a.amount - b.amount
            : b.amount - a.amount;
        } else {
          return 0;
        }
      });
  }, [search, sortBy, sortDirection, filterCategory]);

  const handleSearch = (e: any) => {
    setSearch(e.target.value);
  };
  const handleSort = (by: string) => {
    if (sortBy === by) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortDirection("asc");
    }
  };
  const handleFilterCategory = (category: string) => {
    setFilterCategory(category);
  };
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category_slug))).filter(
      Boolean,
    );
  }, [transactions]);

  return (
    <div className="bg-background rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-foreground",
          )}
        >
          <SearchIcon className="w-4 h-4" />
        </div>
        <Input
          type="search"
          placeholder="Search transactions..."
          className="pl-8 pr-4 py-2 rounded-md border border-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterCategory === ""}
                onCheckedChange={() => handleFilterCategory("")}
              >
                All
              </DropdownMenuCheckboxItem>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filterCategory === category}
                  onCheckedChange={() => handleFilterCategory(category || "")}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ListOrderedIcon className="w-4 h-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSort}>
                <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="amount">
                  Amount
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortDirection === "asc"}
                onCheckedChange={() => setSortDirection("asc")}
              >
                Ascending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortDirection === "desc"}
                onCheckedChange={() => setSortDirection("desc")}
              >
                Descending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-y scrollbar-hide">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date
                {sortBy === "date" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount
                {sortBy === "amount" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto scrollbar-hide border-none">
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-none">
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.merchant_name}</TableCell>
                <TableCell className="text-right">
                  {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.category_slug === "meals"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {transaction.category_slug}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SimilarTransactions;
