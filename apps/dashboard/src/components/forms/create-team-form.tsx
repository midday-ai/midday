"use client";

import { currencies, uniqueCurrencies } from "@midday/location/currencies";
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
import { AnimatePresence, motion } from "framer-motion";
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { revalidateAfterTeamChange } from "@/actions/revalidate-action";
import { SearchAddressInput } from "@/components/search-address-input";
import { SelectCurrency } from "@/components/select-currency";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { CountrySelector } from "../country-selector";
import { SelectFiscalMonth } from "../select-fiscal-month";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  countryCode: z.string().min(1, { message: "Country is required." }),
  baseCurrency: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().optional(),
  addressLine1: z.string().min(1, { message: "Street address is required." }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().optional(),
  zip: z.string().min(1, { message: "Postal code is required." }),
  vatNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
};

export function CreateTeamForm({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
}: Props) {
  const currency = use(defaultCurrencyPromise);
  const countryCode = use(defaultCountryCodePromise);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressFields, setShowAddressFields] = useState(false);
  const isSubmittedRef = useRef(false);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: async () => {
        // Lock the form permanently - user will be redirected
        setIsLoading(true);
        isSubmittedRef.current = true;

        await queryClient.invalidateQueries();
        await revalidateAfterTeamChange();
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

  // Auto-update currency and fiscal year when country changes
  const selectedCountryCode = form.watch("countryCode");
  useEffect(() => {
    if (!selectedCountryCode) return;

    const defaultFiscalYear =
      getDefaultFiscalYearStartMonth(selectedCountryCode);
    if (defaultFiscalYear !== form.getValues("fiscalYearStartMonth")) {
      form.setValue("fiscalYearStartMonth", defaultFiscalYear);
    }

    const countryCurrency =
      currencies[selectedCountryCode as keyof typeof currencies];
    if (countryCurrency) {
      form.setValue("baseCurrency", countryCurrency);
    }
  }, [selectedCountryCode, form]);

  // Computed loading state that can never be reset unexpectedly
  const isFormLocked = isLoading || isSubmittedRef.current;

  function onSubmit(values: FormValues) {
    if (isFormLocked) {
      return;
    }

    setIsLoading(true);
    isSubmittedRef.current = true;

    createTeamMutation.mutate({
      name: values.name,
      baseCurrency: values.baseCurrency,
      countryCode: values.countryCode,
      fiscalYearStartMonth: values.fiscalYearStartMonth,
      switchTeam: true,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      state: values.state,
      zip: values.zip,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mt-4 w-full border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4 border-b border-border pb-4 space-y-4">
          <div className="text-xs text-[#666] font-normal">Company address</div>

          <SearchAddressInput
            placeholder="Search for an address..."
            onSelect={(result) => {
              if (result.address_line_1) {
                form.setValue("addressLine1", result.address_line_1);
              }
              if (result.city) {
                form.setValue("city", result.city);
              }
              if (result.state) {
                form.setValue("state", result.state);
              }
              if (result.zip) {
                form.setValue("zip", result.zip);
              }
              if (result.country_code) {
                form.setValue("countryCode", result.country_code);
              }
              setShowAddressFields(true);
            }}
          />

          {!showAddressFields && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddressFields(true)}
            >
              Enter address manually
            </button>
          )}

          <AnimatePresence>
            {showAddressFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 overflow-hidden"
              >
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CountrySelector
                          defaultValue={field.value ?? ""}
                          onSelect={(code) => {
                            field.onChange(code);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Street address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem className="w-[120px]">
                        <FormControl>
                          <Input {...field} placeholder="ZIP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FormField
          control={form.control}
          name="baseCurrency"
          render={({ field }) => (
            <FormItem className="mt-4 border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">
                Base currency
              </FormLabel>
              <FormControl>
                <SelectCurrency currencies={uniqueCurrencies} {...field} />
              </FormControl>
              <FormDescription>
                Auto-set from your country. You can change it later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fiscalYearStartMonth"
          render={({ field }) => (
            <FormItem className="mt-4 border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">
                Fiscal year starts
              </FormLabel>
              <FormControl>
                <SelectFiscalMonth {...field} />
              </FormControl>
              <FormDescription>
                Auto-set from your country. You can change it later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          className="mt-6 w-full"
          type="submit"
          isSubmitting={isFormLocked}
        >
          Create
        </SubmitButton>
      </form>
    </Form>
  );
}
