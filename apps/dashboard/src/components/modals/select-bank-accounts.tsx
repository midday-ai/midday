"use client";

import { connectBankAccountAction } from "@/actions/connect-bank-account-action";
import { getAccounts } from "@/actions/institutions/get-accounts";
import { connectBankAccountSchema } from "@/actions/schema";
import { sendSupportAction } from "@/actions/send-support-action";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useI18n } from "@/locales/client";
import { getInitials } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
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
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent } from "@midday/ui/tabs";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { FormatAmount } from "../format-amount";
import { LoadingTransactionsEvent } from "../loading-transactions-event";

type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
  subtype: string;
  mask: string;
  institution: {
    id: string;
    name: string;
  };
};

function RowsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[210px] rounded-none" />
          <Skeleton className="h-2.5 w-[180px] rounded-none" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-[250px] rounded-none" />
          <Skeleton className="h-2.5 w-[200px] rounded-none" />
        </div>
      </div>
    </div>
  );
}

function SupportForm() {
  const form = useForm({
    resolver: zodResolver(z.object({ message: z.string() })),
    defaultValues: {
      message: "",
    },
  });

  const sendSupport = useAction(sendSupportAction, {
    onSuccess: () => {
      form.reset();
    },
  });

  const handleOnSubmit = form.handleSubmit((values) => {
    sendSupport.execute({
      message: values.message,
      type: "bank-connection",
      priority: "3",
      subject: "Select bank accounts",
      url: document.URL,
    });
  });

  if (sendSupport.status === "hasSucceeded") {
    return (
      <div className="h-[250px] flex items-center justify-center flex-col space-y-1">
        <p className="font-medium text-sm">Thank you!</p>
        <p className="text-sm text-[#4C4C4C]">
          We will be back with you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleOnSubmit}>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                  className="resize-none min-h-[150px]"
                  autoFocus
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              sendSupport.status === "executing" || !form.formState.isValid
            }
            className="mt-4"
          >
            {sendSupport.status === "executing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function SelectBankAccountsModal() {
  const { toast } = useToast();
  const t = useI18n();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string>();
  const [accessToken, setAccessToken] = useState<string>();
  const [activeTab, setActiveTab] = useState<
    "select-accounts" | "loading" | "support"
  >("select-accounts");

  const {
    step,
    error,
    setParams,
    provider,
    ref,
    institution_id,
    token,
    enrollment_id,
  } = useConnectParams();

  const isOpen = step === "account";

  useEffect(() => {
    if (error) {
      // NOTE: On GoCardLess cancel flow
      setParams({
        step: "connect",
        error: null,
        details: null,
        provider: null,
      });
    }
  }, [error, setParams]);

  const onClose = () => {
    setParams(
      { step: null },
      {
        // NOTE: Rerender so the overview modal is visible
        shallow: false,
      },
    );
  };

  const connectBankAction = useAction(connectBankAccountAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
    onSuccess: ({ data }) => {
      if (data?.id) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
        setActiveTab("loading");
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
      const { data } = await getAccounts({
        provider: provider as
          | "teller"
          | "plaid"
          | "gocardless"
          | "enablebanking",
        id: ref ?? undefined,
        accessToken: token ?? undefined,
        institutionId: institution_id ?? undefined,
      });

      setAccounts(data);
      setLoading(false);

      if (!form.formState.isValid) {
        form.reset({
          provider: provider as
            | "gocardless"
            | "plaid"
            | "teller"
            | "enablebanking",
          accessToken: token ?? undefined,
          enrollmentId: enrollment_id ?? undefined,
          // GoCardLess Requestion ID or Plaid Item ID
          referenceId: ref ?? undefined,
          accounts: data.map((account) => ({
            name: account.name,
            institution_id: account.institution.id,
            logo_url: account.institution?.logo,
            account_id: account.id,
            account_reference: account.resource_id,
            bank_name: account.institution.name,
            // TODO: Remove once we have a fix and return currency from engine
            currency: account.currency ?? account.balance.currency,
            balance: account.balance.amount,
            enabled: true,
            type: account.type,
            expires_at: account.expires_at,
          })),
        });
      }
    }

    if (isOpen && !accounts.length) {
      fetchData();
    }
  }, [
    isOpen,
    provider,
    form,
    accounts,
    ref,
    token,
    institution_id,
    enrollment_id,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="p-4">
          <Tabs defaultValue="select-accounts" value={activeTab}>
            <TabsContent value="select-accounts">
              <>
                <DialogHeader className="mb-8">
                  <DialogTitle>Select Accounts</DialogTitle>
                  <DialogDescription>
                    Select the accounts to receive transactions. You can enable
                    or disable them later in settings if needed. Note: Initial
                    loading may take some time.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 h-[300px] overflow-auto pb-[100px] relative scrollbar-hide"
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
                              <FormLabel className="flex items-center space-x-4 w-full mr-8">
                                <Avatar className="size-[34px]">
                                  <AvatarFallback className="text-[11px]">
                                    {getInitials(account.name)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <p className="font-medium leading-none mb-1 text-sm">
                                      {account.name}
                                    </p>
                                    <span className="text-xs text-[#878787] font-normal">
                                      {t(`account_type.${account.type}`)}
                                    </span>
                                  </div>

                                  <span className="text-[#878787] text-sm">
                                    <FormatAmount
                                      amount={account.balance.amount}
                                      currency={account.balance.currency}
                                    />
                                  </span>
                                </div>
                              </FormLabel>

                              <div>
                                <FormControl>
                                  <Switch
                                    checked={
                                      field.value.find(
                                        (value) =>
                                          value.account_id === account.id,
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
                                        }),
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

                      <div className="flex justify-center mt-4">
                        <button
                          type="button"
                          className="text-xs text-[#878787]"
                          onClick={() => setActiveTab("support")}
                        >
                          Need support
                        </button>
                      </div>
                    </div>
                  </form>
                </Form>
              </>
            </TabsContent>

            <TabsContent value="loading">
              <LoadingTransactionsEvent
                accessToken={accessToken}
                runId={runId}
                setRunId={setRunId}
                onClose={onClose}
                setActiveTab={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="support">
              <div className="flex items-center space-x-3 mb-6">
                <button
                  type="button"
                  className="items-center border bg-accent p-1"
                  onClick={() => setActiveTab("select-accounts")}
                >
                  <Icons.ArrowBack />
                </button>
                <h2>Support</h2>
              </div>
              <SupportForm />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
