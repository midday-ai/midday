"use client";

import { bulkUpdateTransactionsAction } from "@/actions/bulk-update-transactions-action";
import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { useToast } from "@midday/ui/use-toast";
import * as Tabs from "@radix-ui/react-tabs";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { AssignUser } from "./assign-user";
import { SelectCategory } from "./select-category";

const sections = [
  {
    id: "categories",
    label: "Categories",
    icon: Icons.Category,
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: Icons.Visibility,
  },
  {
    id: "assign",
    label: "Assign",
    icon: Icons.Face,
  },
  {
    id: "status",
    label: "Status",
    icon: Icons.AlertCircle,
  },
];

export function BulkActions({ ids }) {
  const [activeId, setActiveId] = useState(sections?.at(0)?.id as string);
  const [isOpen, setOpen] = useState(false);
  const { toast } = useToast();

  const { setTransactionIds } = useTransactionsStore();

  const bulkUpdateTransactions = useAction(bulkUpdateTransactionsAction, {
    onExecute: ({ input }) => {
      if (input.type === "status") {
        setTransactionIds(undefined);
      }
    },
    onSuccess: ({ data }) => {
      setTransactionIds(undefined);
      toast({
        title: `Updated ${data?.length} transactions.`,
        variant: "success",
        duration: 3500,
      });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <span>Actions</span>
          <ChevronDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[500px] mt-2.5 p-0 overflow-hidden"
        align="end"
      >
        <Tabs.Root
          defaultValue="categories"
          className="flex flex-row divide-x-[1px]"
          onValueChange={setActiveId}
          value={activeId}
        >
          <Tabs.TabsList className="w-[220px] h-[210px] p-4 flex flex-col items-start">
            {sections?.map(({ id, label, icon: Icon }) => {
              const isActive = activeId === id;

              return (
                <Tabs.TabsTrigger value={id} asChild key={id}>
                  <Button
                    className={cn(
                      "w-[190px] items-center justify-start relative mb-1.5 group",
                      isActive && "bg-secondary",
                    )}
                    variant="ghost"
                  >
                    {Icon && <Icon size={16} />}
                    <p
                      className={cn(
                        "p-sm font-normal ml-2 text-primary",
                        isActive && "bg-secondary",
                      )}
                    >
                      {label}
                    </p>
                    <ChevronRight
                      size={16}
                      className={cn(
                        "absolute right-2 invisible group-hover:visible",
                        isActive && "visible",
                      )}
                    />
                  </Button>
                </Tabs.TabsTrigger>
              );
            })}
          </Tabs.TabsList>

          {sections?.map((section) => {
            return (
              <Tabs.TabsContent
                value={section.id}
                className="p-4 space-y-4 w-full"
                key={section.id}
              >
                {section.id === "categories" && (
                  <SelectCategory
                    placeholder="Category"
                    onChange={(category) => {
                      bulkUpdateTransactions.execute({
                        type: "category",
                        data: ids.map((transaction) => ({
                          id: transaction,
                          category_slug: category.slug,
                        })),
                      });
                    }}
                  />
                )}

                {section.id === "transactions" && (
                  <RadioGroup
                    defaultValue="include"
                    onValueChange={(status) => {
                      bulkUpdateTransactions.execute({
                        type: "status",
                        data: ids.map((transaction) => ({
                          id: transaction,
                          status,
                        })),
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="posted" id="posted" />
                      <Label htmlFor="posted">Include</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excluded" id="excluded" />
                      <Label htmlFor="excluded">Exclude</Label>
                    </div>
                  </RadioGroup>
                )}

                {section.id === "assign" && (
                  <AssignUser
                    onSelect={(userId) => {
                      bulkUpdateTransactions.execute({
                        type: "assigned",
                        data: ids.map((transaction) => ({
                          id: transaction,
                          assigned_id: userId,
                        })),
                      });
                    }}
                  />
                )}

                {section.id === "status" && (
                  <RadioGroup
                    onValueChange={(status) => {
                      bulkUpdateTransactions.execute({
                        type: "status",
                        data: ids.map((transaction) => ({
                          id: transaction,
                          status,
                        })),
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="completed" id="completed" />
                      <Label htmlFor="completed">Completed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="posted" id="posted" />
                      <Label htmlFor="posted">Uncompleted</Label>
                    </div>
                  </RadioGroup>
                )}
              </Tabs.TabsContent>
            );
          })}
        </Tabs.Root>
      </PopoverContent>
    </Popover>
  );
}
