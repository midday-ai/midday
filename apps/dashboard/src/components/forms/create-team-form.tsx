"use client";

import { revalidateAfterTeamChange } from "@/actions/revalidate-action";
import { SelectCurrency } from "@/components/select-currency";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
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
import { use, useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { CountrySelector } from "../country-selector";
import { SelectFiscalMonth } from "../select-fiscal-month";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  countryCode: z.string(),
  baseCurrency: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().optional(),
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
  const isSubmittedRef = useRef(false);

  const createTeamMutation = useMutation(
    trpc.team.create.mutationOptions({
      onSuccess: async (teamId) => {
        const successId = `team_creation_success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`[${successId}] Team creation mutation successful`, {
          teamId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        // Lock the form permanently - never reset on success
        setIsLoading(true);
        isSubmittedRef.current = true;

        try {
          // Invalidate all queries to ensure fresh data everywhere
          console.log(`[${successId}] Invalidating queries`);
          await queryClient.invalidateQueries();

          // Revalidate server-side paths and redirect
          console.log(`[${successId}] Revalidating server-side paths`);
          await revalidateAfterTeamChange();

          console.log(
            `[${successId}] Team creation flow completed successfully`,
          );
        } catch (error) {
          // Check if this is a Next.js redirect (expected behavior)
          if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            console.log(
              `[${successId}] Team creation completed successfully - redirecting to home`,
            );
            // This is expected - Next.js redirects work by throwing this error
            return;
          }

          // Only log actual errors, not expected redirects
          console.error(`[${successId}] Team creation flow failed:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            teamId,
          });
        }
        // Note: We NEVER reset loading state on success - user should be redirected
      },
      onError: (error) => {
        const errorId = `team_creation_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const errorContext = {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        };

        console.error(
          `[${errorId}] Team creation mutation failed`,
          errorContext,
        );

        // Capture error in Sentry for debugging
        if (error instanceof Error && process.env.NODE_ENV === "production") {
          import("@sentry/nextjs").then((Sentry) => {
            Sentry.captureException(error, {
              extra: {
                ...errorContext,
                errorId,
                component: "CreateTeamForm",
                action: "team_creation_mutation",
              },
            });
          });
        }

        setIsLoading(false);
        isSubmittedRef.current = false; // Reset on error to allow retry
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

  // Update fiscal year when country changes
  const selectedCountryCode = form.watch("countryCode");
  useEffect(() => {
    const defaultFiscalYear =
      getDefaultFiscalYearStartMonth(selectedCountryCode);
    if (defaultFiscalYear !== form.getValues("fiscalYearStartMonth")) {
      form.setValue("fiscalYearStartMonth", defaultFiscalYear);
    }
  }, [selectedCountryCode, form]);

  // Computed loading state that can never be reset unexpectedly
  const isFormLocked = isLoading || isSubmittedRef.current;

  function onSubmit(values: FormValues) {
    if (isFormLocked) {
      console.warn("Team creation form submission blocked - form is locked", {
        isFormLocked,
        isLoading,
        isSubmittedRef: isSubmittedRef.current,
        formValues: values,
      });
      return;
    }

    const submissionId = `form_submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${submissionId}] Team creation form submission started`, {
      teamName: values.name,
      baseCurrency: values.baseCurrency,
      countryCode: values.countryCode,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    setIsLoading(true);
    isSubmittedRef.current = true; // Permanent flag that survives re-renders

    createTeamMutation.mutate({
      name: values.name,
      baseCurrency: values.baseCurrency,
      countryCode: values.countryCode,
      fiscalYearStartMonth: values.fiscalYearStartMonth,
      switchTeam: true, // Automatically switch to the new team
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mt-4 w-full">
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

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem className="mt-4 w-full">
              <FormLabel className="text-xs text-[#666] font-normal">
                Country
              </FormLabel>
              <FormControl className="w-full">
                <CountrySelector
                  defaultValue={field.value ?? ""}
                  onSelect={(code, name) => {
                    field.onChange(name);
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
            <FormItem className="mt-4 border-b border-border pb-4">
              <FormLabel className="text-xs text-[#666] font-normal">
                Base currency
              </FormLabel>
              <FormControl>
                <SelectCurrency currencies={uniqueCurrencies} {...field} />
              </FormControl>

              <FormDescription>
                If you have multiple accounts in different currencies, this will
                be the default currency for your company. You can change it
                later.
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
                When does your company's fiscal year begin? This determines
                default date ranges for reports. You can change it later.
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
