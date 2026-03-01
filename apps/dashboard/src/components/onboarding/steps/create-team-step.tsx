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
import { SelectCompanyType } from "@/components/select-company-type";
import { SelectCurrency } from "@/components/select-currency";
import { SelectFiscalMonth } from "@/components/select-fiscal-month";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  companyType: z
    .enum(["freelancer", "solo_founder", "small_team", "agency", "exploring"])
    .optional(),
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
          companyType: form.getValues("companyType"),
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
        companyType: values.companyType,
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
          <form
            id="create-team-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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

            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <FormItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fiscalYearStartMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-primary font-normal">
                        Fiscal year starts
                      </FormLabel>
                      <FormControl>
                        <SelectFiscalMonth
                          triggerClassName="bg-secondary border-border text-foreground"
                          popoverProps={{
                            side: "bottom",
                            avoidCollisions: false,
                          }}
                          listClassName="max-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-[11px] text-muted-foreground">
                Used for reports and default date ranges. You can change these
                later.
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-primary font-normal">
                    What best describes you?
                  </FormLabel>
                  <FormControl>
                    <SelectCompanyType
                      value={field.value}
                      onChange={field.onChange}
                      className="bg-secondary border-border text-foreground"
                    />
                  </FormControl>
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
