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
import { Textarea } from "@midday/ui/textarea";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useUnderwritingWizard } from "../wizard-context";
import { profileStepSchema } from "../wizard-schemas";

type Props = {
  merchant: {
    id: string;
    name: string | null;
    email: string;
  };
};

export function StepProfile({ merchant }: Props) {
  const { state, nextStep, setProfile, setApplicationId } =
    useUnderwritingWizard();
  const trpc = useTRPC();

  const form = useZodForm(profileStepSchema, {
    defaultValues: {
      merchantId: state.profile?.merchantId || merchant.id,
      merchantName: state.profile?.merchantName || merchant.name || "",
      requestedAmountMin: state.profile?.requestedAmountMin,
      requestedAmountMax: state.profile?.requestedAmountMax,
      useOfFunds: state.profile?.useOfFunds || "",
      ficoRange: state.profile?.ficoRange || "",
      timeInBusinessMonths: state.profile?.timeInBusinessMonths,
      brokerNotes: state.profile?.brokerNotes || "",
      priorMcaHistory: state.profile?.priorMcaHistory || "",
    },
  });

  const createMutation = useMutation(
    trpc.underwritingApplications.create.mutationOptions({
      onSuccess: (result) => {
        if (result) {
          setApplicationId(result.id);
        }
        nextStep();
      },
    }),
  );

  const handleSubmit = (data: typeof profileStepSchema._type) => {
    setProfile(data);

    // If we already have an applicationId (going back and forth), just advance
    if (state.applicationId) {
      nextStep();
      return;
    }

    createMutation.mutate({
      merchantId: data.merchantId,
      requestedAmountMin: data.requestedAmountMin,
      requestedAmountMax: data.requestedAmountMax,
      useOfFunds: data.useOfFunds,
      ficoRange: data.ficoRange,
      timeInBusinessMonths: data.timeInBusinessMonths,
      brokerNotes: data.brokerNotes,
      priorMcaHistory: data.priorMcaHistory,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Merchant Info (read-only) */}
        <div className="bg-background border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground text-lg font-medium">
              {merchant.name?.[0] || "?"}
            </div>
            <div>
              <div className="text-sm font-medium">{merchant.name}</div>
              <div className="text-xs text-[#606060]">{merchant.email}</div>
            </div>
          </div>
        </div>

        {/* Requested Amount Range */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Requested Amount</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="requestedAmountMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Minimum ($)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="10000"
                      autoComplete="off"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedAmountMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Maximum ($)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="50000"
                      autoComplete="off"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Business Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Business Details</h3>

          <FormField
            control={form.control}
            name="useOfFunds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  Use of Funds
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Working capital, inventory, equipment..."
                    autoComplete="off"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ficoRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  FICO Range
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="600+"
                    autoComplete="off"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeInBusinessMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  Time in Business (months)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="24"
                    autoComplete="off"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notes</h3>

          <FormField
            control={form.control}
            name="brokerNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  Broker Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Any notes from the broker or ISO about this merchant..."
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priorMcaHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  Prior MCA History
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Previous advances, stacking history, payment performance..."
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {createMutation.isError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
            {createMutation.error?.message ||
              "Failed to create application. Please try again."}
          </div>
        )}

        <div className="flex justify-end">
          <SubmitButton
            isSubmitting={createMutation.isPending}
            disabled={createMutation.isPending}
          >
            Next
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
