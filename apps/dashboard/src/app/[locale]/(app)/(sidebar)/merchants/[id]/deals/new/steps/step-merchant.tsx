"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { getWebsiteLogo } from "@/utils/logos";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
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
import Image from "next/image";
import { useWizard } from "../wizard-context";
import { merchantStepSchema } from "../wizard-schemas";

type Props = {
  merchant: {
    id: string;
    name: string | null;
    email: string;
    website: string | null;
  };
};

export function StepMerchant({ merchant }: Props) {
  const { state, nextStep, setMerchant } = useWizard();
  const trpc = useTRPC();

  const { data: brokers } = useQuery(
    trpc.brokers.get.queryOptions({ pageSize: 100 }),
  );

  const form = useZodForm(merchantStepSchema, {
    defaultValues: {
      merchantId: state.merchant?.merchantId || merchant.id,
      merchantName: state.merchant?.merchantName || merchant.name || "",
      brokerId: state.merchant?.brokerId,
      commissionPercentage: state.merchant?.commissionPercentage,
    },
  });

  const selectedBrokerId = form.watch("brokerId");
  const selectedBroker = brokers?.data?.find((b) => b.id === selectedBrokerId);
  const logoSrc = merchant.website ? getWebsiteLogo(merchant.website) : null;

  const handleSubmit = (data: typeof merchantStepSchema._type) => {
    setMerchant(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Merchant Info Card */}
        <div className="bg-background border border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {logoSrc && (
                <Image
                  src={logoSrc}
                  alt={merchant.name || ""}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <AvatarFallback className="text-lg">
                {merchant.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{merchant.name}</div>
              <div className="text-xs text-[#606060]">{merchant.email}</div>
            </div>
          </div>
        </div>

        {/* Broker Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Broker (Optional)</h3>

          <FormField
            control={form.control}
            name="brokerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-[#878787] font-normal">
                  ISO / Broker
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const broker = brokers?.data?.find((b) => b.id === value);
                    if (
                      broker?.commissionPercentage &&
                      !form.getValues("commissionPercentage")
                    ) {
                      form.setValue(
                        "commissionPercentage",
                        Number(broker.commissionPercentage),
                        { shouldDirty: true },
                      );
                    }
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No broker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            <FormField
              control={form.control}
              name="commissionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Commission %
                    {selectedBroker?.commissionPercentage && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        (default: {Number(selectedBroker.commissionPercentage)}
                        %)
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
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  );
}
