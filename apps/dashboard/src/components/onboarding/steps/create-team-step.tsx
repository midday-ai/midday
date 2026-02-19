"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { getDefaultFiscalYearStartMonth } from "@midday/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { CountrySelector } from "@/components/country-selector";
import { SelectCurrency } from "@/components/select-currency";
import { SelectFiscalMonth } from "@/components/select-fiscal-month";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  countryCode: z.string(),
  baseCurrency: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
  onComplete: () => void;
  onCountryChange?: (countryCode: string) => void;
  onLoadingChange?: (loading: boolean) => void;
};

export function CreateTeamStep({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  onComplete,
  onCountryChange,
  onLoadingChange,
}: Props) {
  const currency = use(defaultCurrencyPromise);
  const countryCode = use(defaultCountryCodePromise);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittedRef = useRef(false);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: async () => {
        track({
          event: LogEvents.OnboardingTeamCreated.name,
          channel: LogEvents.OnboardingTeamCreated.channel,
          countryCode: form.getValues("countryCode"),
          currency: form.getValues("baseCurrency"),
        });
        await queryClient.invalidateQueries();
        onComplete();
      },
      onError: () => {
        setIsLoading(false);
        isSubmittedRef.current = false;
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
      baseCurrency: currency,
      countryCode: countryCode ?? "",
      fiscalYearStartMonth: getDefaultFiscalYearStartMonth(countryCode),
    },
  });

  const selectedCountryCode = form.watch("countryCode");
  useEffect(() => {
    const defaultFiscalYear =
      getDefaultFiscalYearStartMonth(selectedCountryCode);
    if (defaultFiscalYear !== form.getValues("fiscalYearStartMonth")) {
      form.setValue("fiscalYearStartMonth", defaultFiscalYear);
    }

    if (selectedCountryCode) {
      onCountryChange?.(selectedCountryCode);
    }
  }, [selectedCountryCode, form, onCountryChange]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const isFormLocked = isLoading || isSubmittedRef.current;

  async function onSubmit(values: FormValues) {
    if (isFormLocked) return;

    setIsLoading(true);
    isSubmittedRef.current = true;

    try {
      createTeamMutation.mutate({
        name: values.name,
        baseCurrency: values.baseCurrency,
        countryCode: values.countryCode,
        fiscalYearStartMonth: values.fiscalYearStartMonth,
        switchTeam: true,
      });
    } catch {
      setIsLoading(false);
      isSubmittedRef.current = false;
    }
  }

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Business details
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Add company details so amounts, currency, tax, and reporting periods
        line up correctly across insights, invoices and exports.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Form {...form}>
          <form id="create-team-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mt-4 w-full">
                  <FormLabel className="text-xs text-primary font-normal">
                    Company name
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Ex: Acme Marketing or Acme Co"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem className="mt-4 w-full">
                  <FormLabel className="text-xs text-primary font-normal">
                    Country
                  </FormLabel>
                  <FormControl className="w-full">
                    <CountrySelector
                      defaultValue={field.value ?? ""}
                      className="bg-secondary border-border text-foreground"
                      onSelect={(code) => {
                        field.onChange(code);
                        form.setValue("countryCode", code);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseCurrency"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-xs text-primary font-normal">
                    Base currency
                  </FormLabel>
                  <FormControl>
                    <SelectCurrency
                      currencies={uniqueCurrencies}
                      triggerClassName="bg-secondary border-border text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    If you have multiple accounts in different currencies, this
                    will be the default currency for your company. You can
                    change it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiscalYearStartMonth"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-xs text-primary font-normal">
                    Fiscal year starts
                  </FormLabel>
                  <FormControl>
                    <SelectFiscalMonth
                      triggerClassName="bg-secondary border-border text-foreground"
                      popoverProps={{ side: "bottom", avoidCollisions: false }}
                      listClassName="max-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    When does your company's fiscal year begin? This determines
                    default date ranges for reports. You can change it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
