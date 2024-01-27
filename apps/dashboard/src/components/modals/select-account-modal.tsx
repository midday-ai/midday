"use client";

import { connectBankAccountAction } from "@/actions/connect-bank-account-action";
import { FormatAmount } from "@/components/format-amount";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAccounts } from "@midday/gocardless";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@midday/ui/form";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/utils";
import { capitalCase } from "change-case";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  accounts: z.array(z.string()).refine((value) => value.some((item) => item)),
});

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[210px]" />
          <Skeleton className="h-2.5 w-[180px]" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[250px]" />
          <Skeleton className="h-2.5 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

export function SelectAccountModal({ countryCode }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isOpen =
    searchParams.get("step") === "account" && !searchParams.has("error");

  const action = useAction(connectBankAccountAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: () => router.push(pathname),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accounts: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const accountsWithDetails = values.accounts
      .map((id) => accounts.find((account) => account.id === id))
      .map((account) => ({
        account_id: account.id,
        name: capitalCase(account.name),
        currency: account.currency,
        owner_name: capitalCase(account.ownerName),
        institution_id: account.institution_id,
        bank_name: account.bank.name,
        logo_url: account.bank.logo,
      }));

    action.execute(accountsWithDetails);
  }

  useEffect(() => {
    async function fetchData() {
      const data = await getAccounts({
        accountId: searchParams.get("ref"),
        countryCode,
      });

      setAccounts(data);
      setLoading(false);

      // Set first accounts to checked
      if (!form.formState.isValid) {
        form.reset({ accounts: [data.at(0).id] });
      }
    }

    if (isOpen && !accounts.length) {
      fetchData();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => router.push(pathname)}>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="p-4">
          <DialogHeader className="mb-8">
            <DialogTitle>Select accounts</DialogTitle>
            <DialogDescription>
              Select the accounts you want to sync with Midday.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loading && <RowsSkeleton />}

              {accounts.map((account) => (
                <FormField
                  key={account.id}
                  control={form.control}
                  name="accounts"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={account.id}
                        className="flex justify-between"
                      >
                        <FormLabel className="flex items-between">
                          <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                            <AvatarImage
                              src={account.bank.logo}
                              alt={account.bank.name}
                            />
                          </Avatar>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none mb-1">
                              {capitalCase(account.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.bank.name} -{" "}
                              <FormatAmount
                                currency={account.balances.available.currency}
                                amount={account.balances.available.amount}
                              />
                            </p>
                          </div>
                        </FormLabel>

                        <div>
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(account.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, account.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== account.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    );
                  }}
                />
              ))}

              <div className="pt-4">
                <Button
                  className={cn("w-full")}
                  type="submit"
                  disabled={action.status === "executing"}
                >
                  {action.status === "executing" ? (
                    <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
