"use client";

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
import { SubmitButton } from "@midday/ui/submit-button";
import { getDefaultFiscalYearStartMonth } from "@midday/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { CountrySelector } from "@/components/country-selector";
import { SelectCurrency } from "@/components/select-currency";
import { SelectFiscalMonth } from "@/components/select-fiscal-month";
import { useUserMutation } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(32)
    .optional(),
  name: z.string().min(2, "Company name must be at least 2 characters."),
  countryCode: z.string(),
  baseCurrency: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
  showFullName: boolean;
  onComplete: () => void;
  onCountryChange?: (countryCode: string) => void;
};

export function CreateTeamStep({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  showFullName,
  onComplete,
  onCountryChange,
}: Props) {
  const currency = use(defaultCurrencyPromise);
  const countryCode = use(defaultCountryCodePromise);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittedRef = useRef(false);
  const updateUserMutation = useUserMutation();

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: async () => {
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
      fullName: "",
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

  const isFormLocked = isLoading || isSubmittedRef.current;

  async function onSubmit(values: FormValues) {
    if (isFormLocked) return;

    setIsLoading(true);
    isSubmittedRef.current = true;

    try {
      if (showFullName && values.fullName) {
        await updateUserMutation.mutateAsync({ fullName: values.fullName });
      }

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
        className="text-sm text-[#878787] leading-relaxed"
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {showFullName && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="mt-4 w-full">
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Full name
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="John Doe"
                        autoComplete="name"
                        className="bg-[#1A1A1A] border-[#2C2C2C] text-white placeholder:text-[#555]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mt-4 w-full">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Company name
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus={!showFullName}
                      placeholder="Ex: Acme Marketing or Acme Co"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="bg-[#1A1A1A] border-[#2C2C2C] text-white placeholder:text-[#555]"
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
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Country
                  </FormLabel>
                  <FormControl className="w-full">
                    <CountrySelector
                      defaultValue={field.value ?? ""}
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
                <FormItem className="mt-4 border-b border-[#2C2C2C] pb-4">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Base currency
                  </FormLabel>
                  <FormControl>
                    <SelectCurrency currencies={uniqueCurrencies} {...field} />
                  </FormControl>
                  <FormDescription className="text-[#555]">
                    Default currency for your company. You can change it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiscalYearStartMonth"
              render={({ field }) => (
                <FormItem className="mt-4 border-b border-[#2C2C2C] pb-4">
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Fiscal year starts
                  </FormLabel>
                  <FormControl>
                    <SelectFiscalMonth {...field} />
                  </FormControl>
                  <FormDescription className="text-[#555]">
                    When does your company's fiscal year begin? You can change
                    it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitButton
              className="mt-6 w-full bg-white text-[#121212] hover:bg-white/90 border-white"
              type="submit"
              isSubmitting={isFormLocked}
            >
              Continue
            </SubmitButton>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
