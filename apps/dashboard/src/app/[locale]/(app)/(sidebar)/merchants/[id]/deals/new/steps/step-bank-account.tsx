"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useWizard } from "../wizard-context";
import { bankAccountStepSchema } from "../wizard-schemas";

export function StepBankAccount() {
  const { state, nextStep, prevStep, setBankAccount } = useWizard();
  const trpc = useTRPC();

  const { data: bankAccounts } = useQuery(
    trpc.bankAccounts.get.queryOptions(),
  );

  const defaultMode = state.bankAccount
    ? state.bankAccount.mode
    : "new";

  const form = useZodForm(bankAccountStepSchema, {
    defaultValues: state.bankAccount || {
      mode: "new" as const,
      bankName: "",
      routingNumber: "",
      accountNumber: "",
      accountType: "checking" as const,
    },
  });

  const mode = form.watch("mode");

  const handleSubmit = (data: typeof bankAccountStepSchema._type) => {
    setBankAccount(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              form.reset({
                mode: "new" as const,
                bankName: "",
                routingNumber: "",
                accountNumber: "",
                accountType: "checking" as const,
              });
            }}
          >
            Enter New
          </Button>
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              form.reset({
                mode: "existing" as const,
                existingBankAccountId: "",
              });
            }}
          >
            Link Existing
          </Button>
          <Button
            type="button"
            variant={mode === "skip" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              form.reset({ mode: "skip" as const });
            }}
          >
            Skip
          </Button>
        </div>

        {/* New Bank Account Fields */}
        {mode === "new" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Bank Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Chase, Wells Fargo..."
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="routingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Routing Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="021000021"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Account Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456789"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Account Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "checking"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Link Existing */}
        {mode === "existing" && (
          <FormField
            control={form.control}
            name="existingBankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  Select Bank Account
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}{" "}
                        {account.currency ? `(${account.currency})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Skip message */}
        {mode === "skip" && (
          <p className="text-sm text-[#878787]">
            You can add bank account details later.
          </p>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep}>
            Back
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  );
}
