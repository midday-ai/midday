"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { format, formatISO } from "date-fns";
import { useWizard } from "../wizard-context";
import { dealTermsStepSchema } from "../wizard-schemas";

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
  variable: "Variable",
};

function DatePickerField({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value: string | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {value ? format(new Date(value), "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(formatISO(date, { representation: "date" }));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function StepDealTerms() {
  const { state, nextStep, prevStep, setDealTerms } = useWizard();

  const form = useZodForm(dealTermsStepSchema, {
    defaultValues: state.dealTerms || {
      paymentFrequency: "daily",
      personalGuarantee: false,
    },
  });

  const fundingAmount = form.watch("fundingAmount");
  const factorRate = form.watch("factorRate");
  const calculatedPayback =
    fundingAmount && factorRate ? +(fundingAmount * factorRate).toFixed(2) : 0;

  const handleSubmit = (data: typeof dealTermsStepSchema._type) => {
    setDealTerms(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Accordion
          type="multiple"
          defaultValue={["core-terms", "contract-dates", "legal-terms"]}
          className="space-y-2"
        >
          {/* Core Terms */}
          <AccordionItem value="core-terms" className="border border-border px-4">
            <AccordionTrigger className="text-sm font-medium py-3">
              Core Terms
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="dealCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Deal Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="MCA-001"
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
                  name="fundingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Funding Amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="50,000"
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
                  name="factorRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Factor Rate
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          placeholder="1.35"
                          autoComplete="off"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paybackAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Payback Amount
                      {calculatedPayback > 0 && (
                        <button
                          type="button"
                          className="ml-2 text-[10px] text-primary/60 hover:text-primary"
                          onClick={() =>
                            form.setValue("paybackAmount", calculatedPayback, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          Use calculated: $
                          {calculatedPayback.toLocaleString()}
                        </button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="67,500"
                        autoComplete="off"
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dailyPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Payment Amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="750"
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
                  name="paymentFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Payment Frequency
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(frequencyLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contract Dates */}
          <AccordionItem value="contract-dates" className="border border-border px-4">
            <AccordionTrigger className="text-sm font-medium py-3">
              Contract Dates
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fundedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Funded Date
                      </FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Start Date
                      </FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstPaymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        First Payment Date
                      </FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maturityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Maturity Date
                      </FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expectedPayoffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Expected Payoff Date
                      </FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="holdbackPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Holdback %
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="15"
                          autoComplete="off"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Legal Terms */}
          <AccordionItem value="legal-terms" className="border border-border px-4">
            <AccordionTrigger className="text-sm font-medium py-3">
              Legal Terms
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="uccFilingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        UCC Filing Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="filed">Filed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="not_filed">Not Filed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="curePeriodDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-[#878787] font-normal">
                        Cure Period (Days)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          placeholder="30"
                          autoComplete="off"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="personalGuarantee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Personal Guarantee
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Default Terms
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe default conditions..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={prevStep}>
            Back
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  );
}
