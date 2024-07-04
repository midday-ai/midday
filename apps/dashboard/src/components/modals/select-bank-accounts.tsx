"use client";

import { getAccounts } from "@/actions/banks/get-accounts";
import { connectBankAccountAction } from "@/actions/connect-bank-account-action";
import { connectBankAccountSchema } from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
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
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent } from "@midday/ui/tabs";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type z from "zod";
import { LoadingTransactionsEvent } from "../loading-transactions-event";

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

export function SelectBankAccountsModal() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string>();

  const [params, setParams] = useQueryStates({
    step: parseAsStringEnum(["connect", "account", "gocardless"]),
    error: parseAsBoolean,
    ref: parseAsString,
    token: parseAsString,
    enrollment_id: parseAsString,
    institution_id: parseAsString,
    provider: parseAsStringEnum(["teller", "plaid", "gocardless"]),
    countryCode: parseAsString,
  });

  const {
    provider,
    step,
    error,
    token,
    ref,
    enrollment_id,
    institution_id,
    countryCode,
  } = params;

  const isOpen = step === "account" && !error;

  const onClose = () => {
    setParams(
      { step: null },
      {
        // NOTE: Rerender so the overview modal is visible
        shallow: false,
      }
    );
  };

  const connectBankAction = useAction(connectBankAccountAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
    onSuccess: (data) => {
      if (data.id) {
        setEventId(data.id);
      }
    },
  });

  const form = useForm<z.infer<typeof connectBankAccountSchema>>({
    resolver: zodResolver(connectBankAccountSchema),
    defaultValues: {
      accounts: [],
    },
  });

  async function onSubmit(values: z.infer<typeof connectBankAccountSchema>) {
    connectBankAction.execute(values);
  }

  useEffect(() => {
    async function fetchData() {
      const data = await getAccounts({
        provider,
        id: ref,
        countryCode,
        accessToken: token,
        institutionId: institution_id,
      });

      setAccounts(data);
      setLoading(false);

      // Set all accounts to checked
      if (!form.formState.isValid) {
        form.reset({
          provider,
          accessToken: token,
          enrollmentId: enrollment_id,
          accounts: data.map((account) => ({
            name: account.name,
            institution_id: account.institution.id,
            logo_url: account.institution?.logo,
            account_id: account.id,
            bank_name: account.institution.name,
            currency: account.currency,
            enabled: false,
            type: account.type,
          })),
        });
      }
    }

    if (isOpen && !accounts.length) {
      fetchData();
    }
  }, [isOpen, provider]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="p-4">
          <Tabs
            defaultValue="select-accounts"
            value={eventId ? "loading" : "select-accounts"}
          >
            <TabsContent value="select-accounts">
              <>
                <DialogHeader className="mb-8">
                  <DialogTitle>Select Accounts</DialogTitle>
                  <DialogDescription>
                    Choose the accounts from which you wish to receive
                    transactions. You can enable or disable accounts in team
                    settings later if needed.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 max-h-[320px] overflow-auto pb-[60px] relative scrollbar-hide"
                  >
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
                              <FormLabel className="flex items-between space-x-4">
                                {account?.institution?.logo && (
                                  <Image
                                    src={account.institution.logo}
                                    alt={account?.institution?.name}
                                    width={34}
                                    height={34}
                                    className="rounded-full overflow-hidden border"
                                  />
                                )}
                                <div className="space-y-1">
                                  <p className="text-sm font-medium leading-none mb-1">
                                    {account.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {account?.institution?.name} (
                                    {account?.currency})
                                  </p>
                                </div>
                              </FormLabel>

                              <div>
                                <FormControl>
                                  <Switch
                                    checked={
                                      field.value.find(
                                        (value) =>
                                          value.account_id === account.id
                                      )?.enabled
                                    }
                                    onCheckedChange={(checked) => {
                                      return field.onChange(
                                        field.value.map((value) => {
                                          if (value.account_id === account.id) {
                                            return {
                                              ...value,
                                              enabled: checked,
                                            };
                                          }

                                          return value;
                                        })
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

                    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background pt-4 px-6 pb-6">
                      <Button
                        className="w-full"
                        type="submit"
                        disabled={
                          connectBankAction.status === "executing" ||
                          !form
                            .getValues("accounts")
                            .find((account) => account.enabled)
                        }
                      >
                        {connectBankAction.status === "executing" ? (
                          <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            </TabsContent>

            <TabsContent value="loading">
              {eventId && (
                <LoadingTransactionsEvent
                  eventId={eventId}
                  setEventId={setEventId}
                  onClose={onClose}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
