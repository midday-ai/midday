"use client";

import { useDealParams } from "@/hooks/use-deal-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatISO } from "date-fns";
import { useState } from "react";
import { z } from "zod/v3";

const formSchema = z.object({
  merchantId: z.string().uuid("Select a merchant"),
  dealCode: z.string().min(1, "Deal code is required"),
  fundingAmount: z.coerce.number().positive("Must be positive"),
  factorRate: z.coerce.number().positive("Must be positive"),
  paybackAmount: z.coerce.number().positive("Must be positive"),
  dailyPayment: z.coerce.number().positive("Must be positive").optional(),
  paymentFrequency: z
    .enum(["daily", "weekly", "bi_weekly", "monthly", "variable"])
    .default("daily"),
  fundedAt: z.string().optional(),
  expectedPayoffDate: z.string().optional(),
  brokerId: z.string().uuid().optional(),
  commissionType: z.enum(["percentage", "flat"]).default("percentage"),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
});

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
  variable: "Variable",
};

const feeTypeLabels: Record<string, string> = {
  origination: "Origination",
  processing: "Processing",
  underwriting: "Underwriting",
  broker: "Broker",
  other: "Other",
};

type FeeRow = {
  key: number;
  feeType: string;
  feeName: string;
  amount: string;
};

export function DealForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useDealParams();
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [feeKeyCounter, setFeeKeyCounter] = useState(0);

  const { data: merchants } = useQuery(
    trpc.merchants.get.queryOptions({ pageSize: 100 }),
  );

  const { data: brokers } = useQuery(
    trpc.brokers.get.queryOptions({ pageSize: 100 }),
  );

  const createFeeMutation = useMutation(
    trpc.dealFees.create.mutationOptions(),
  );

  const createDealMutation = useMutation(
    trpc.mcaDeals.create.mutationOptions({
      onSuccess: async (result) => {
        // Create fees for the newly created deal
        const validFees = feeRows.filter(
          (f) => f.feeName.trim() && Number(f.amount) > 0,
        );

        if (validFees.length > 0 && result?.id) {
          await Promise.all(
            validFees.map((fee) =>
              createFeeMutation.mutateAsync({
                dealId: result.id,
                feeType: fee.feeType as "origination" | "processing" | "underwriting" | "broker" | "other",
                feeName: fee.feeName,
                amount: Number(fee.amount),
              }),
            ),
          );
        }

        queryClient.invalidateQueries({
          queryKey: trpc.mcaDeals.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.mcaDeals.stats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getMcaDeals.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getMcaDealStats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getDeals.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getDealStats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getCommissions.queryKey(),
        });
        setParams(null);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      paymentFrequency: "daily",
    },
  });

  const fundingAmount = form.watch("fundingAmount");
  const factorRate = form.watch("factorRate");

  // Auto-calculate payback when funding and factor rate change
  const calculatedPayback =
    fundingAmount && factorRate ? +(fundingAmount * factorRate).toFixed(2) : 0;

  const selectedBrokerId = form.watch("brokerId");
  const selectedBroker = brokers?.data?.find((b) => b.id === selectedBrokerId);
  const commissionType = form.watch("commissionType");

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    createDealMutation.mutate({
      ...data,
      dailyPayment: data.dailyPayment || undefined,
      fundedAt: data.fundedAt || undefined,
      expectedPayoffDate: data.expectedPayoffDate || undefined,
      brokerId: data.brokerId || undefined,
      commissionType: data.brokerId ? data.commissionType : undefined,
      commissionPercentage:
        data.commissionType === "percentage"
          ? data.commissionPercentage
          : undefined,
      commissionAmount:
        data.commissionType === "flat" ? data.commissionAmount : undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="h-[calc(100vh-180px)] scrollbar-hide overflow-auto">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="merchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Merchant
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select merchant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {merchants?.data?.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brokerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Broker (optional)
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value === "none") {
                        field.onChange(undefined);
                        form.setValue("commissionType", "percentage");
                        form.setValue("commissionPercentage", undefined);
                        form.setValue("commissionAmount", undefined);
                        return;
                      }
                      field.onChange(value);
                      const broker = brokers?.data?.find(
                        (b) => b.id === value,
                      );
                      if (broker) {
                        if (
                          !form.getValues("commissionPercentage") &&
                          !form.getValues("commissionAmount")
                        ) {
                          if (broker.commissionPercentage) {
                            form.setValue("commissionType", "percentage", {
                              shouldDirty: true,
                            });
                            form.setValue(
                              "commissionPercentage",
                              Number(broker.commissionPercentage),
                              { shouldDirty: true },
                            );
                          }
                        }
                      }
                    }}
                    value={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No broker" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No broker</SelectItem>
                      {brokers?.data?.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name}
                          {broker.companyName ? ` (${broker.companyName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBrokerId && (
              <div className="space-y-3 p-3 border border-border rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#878787] font-normal">
                    Commission
                  </span>
                  <FormField
                    control={form.control}
                    name="commissionType"
                    render={({ field }) => (
                      <div className="flex gap-1 bg-muted rounded-md p-0.5">
                        <button
                          type="button"
                          className={cn(
                            "px-2 py-1 text-[10px] rounded transition-colors",
                            field.value === "percentage"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground",
                          )}
                          onClick={() => field.onChange("percentage")}
                        >
                          Percentage
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "px-2 py-1 text-[10px] rounded transition-colors",
                            field.value === "flat"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground",
                          )}
                          onClick={() => field.onChange("flat")}
                        >
                          Flat Fee
                        </button>
                      </div>
                    )}
                  />
                </div>

                {commissionType === "percentage" ? (
                  <FormField
                    control={form.control}
                    name="commissionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#878787] font-normal">
                          Rate (%)
                          {selectedBroker?.commissionPercentage && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              (default:{" "}
                              {Number(selectedBroker.commissionPercentage)}%)
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="10"
                            autoComplete="off"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        {fundingAmount && field.value ? (
                          <p className="text-[10px] text-muted-foreground">
                            Commission: $
                            {(
                              fundingAmount *
                              (Number(field.value) / 100)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="commissionAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#878787] font-normal">
                          Flat Fee ($)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="2500"
                            autoComplete="off"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fundedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Funded Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {field.value
                              ? format(new Date(field.value), "MMM d, yyyy")
                              : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(value) => {
                            if (value) {
                              field.onChange(
                                formatISO(value, { representation: "date" }),
                              );
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedPayoffDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      Expected Payoff Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {field.value
                              ? format(new Date(field.value), "MMM d, yyyy")
                              : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(value) => {
                            if (value) {
                              field.onChange(
                                formatISO(value, { representation: "date" }),
                              );
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fees Section */}
            <div className="border-t border-border pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#878787] font-normal">
                  Deal Fees (optional)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const nextKey = feeKeyCounter + 1;
                    setFeeKeyCounter(nextKey);
                    setFeeRows((prev) => [
                      ...prev,
                      {
                        key: nextKey,
                        feeType: "origination",
                        feeName: "",
                        amount: "",
                      },
                    ]);
                  }}
                >
                  <Icons.Plus className="size-3 mr-1" />
                  Add Fee
                </Button>
              </div>

              {feeRows.map((fee, index) => (
                <div
                  key={fee.key}
                  className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 mb-2 items-end"
                >
                  <div>
                    {index === 0 && (
                      <label className="text-[10px] text-[#878787] mb-1 block">
                        Type
                      </label>
                    )}
                    <Select
                      value={fee.feeType}
                      onValueChange={(value) => {
                        setFeeRows((prev) =>
                          prev.map((f) =>
                            f.key === fee.key ? { ...f, feeType: value } : f,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(feeTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {index === 0 && (
                      <label className="text-[10px] text-[#878787] mb-1 block">
                        Name
                      </label>
                    )}
                    <Input
                      className="h-9 text-xs"
                      placeholder="Fee name"
                      value={fee.feeName}
                      onChange={(e) => {
                        setFeeRows((prev) =>
                          prev.map((f) =>
                            f.key === fee.key
                              ? { ...f, feeName: e.target.value }
                              : f,
                          ),
                        );
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    {index === 0 && (
                      <label className="text-[10px] text-[#878787] mb-1 block">
                        Amount
                      </label>
                    )}
                    <Input
                      className="h-9 text-xs"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={fee.amount}
                      onChange={(e) => {
                        setFeeRows((prev) =>
                          prev.map((f) =>
                            f.key === fee.key
                              ? { ...f, amount: e.target.value }
                              : f,
                          ),
                        );
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-[#878787] hover:text-destructive"
                    onClick={() => {
                      setFeeRows((prev) =>
                        prev.filter((f) => f.key !== fee.key),
                      );
                    }}
                  >
                    <Icons.Close className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-end mt-auto space-x-4">
            <Button
              variant="outline"
              onClick={() => setParams(null)}
              type="button"
            >
              Cancel
            </Button>

            <SubmitButton
              isSubmitting={createDealMutation.isPending}
              disabled={
                createDealMutation.isPending || !form.formState.isDirty
              }
            >
              Create Deal
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
