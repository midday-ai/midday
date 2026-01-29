"use client";

import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { z } from "zod/v3";
import { CountrySelector } from "./country-selector";
import {
  type AddressDetails,
  SearchAddressInput,
} from "./search-address-input";

const formSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  countryCode: z.string().optional(),
});

export function CompanyAddress() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      addressLine1: data?.addressLine1 ?? "",
      addressLine2: data?.addressLine2 ?? "",
      city: data?.city ?? "",
      zip: data?.zip ?? "",
      countryCode: data?.countryCode ?? "",
    },
  });

  const onSelectAddress = (address: AddressDetails) => {
    form.setValue("addressLine1", address.address_line_1);
    form.setValue("city", address.city);
    form.setValue("countryCode", address.country_code);
    form.setValue("zip", address.zip);
  };

  const onSubmit = form.handleSubmit((formData) => {
    updateTeamMutation.mutate({
      addressLine1: formData.addressLine1 || undefined,
      addressLine2: formData.addressLine2 || undefined,
      city: formData.city || undefined,
      zip: formData.zip || undefined,
      countryCode: formData.countryCode || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company address</CardTitle>
            <CardDescription>
              Your company's registered business address. This will appear on
              invoices and legal documents.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <SearchAddressInput
              onSelect={onSelectAddress}
              placeholder="Search for an address"
            />

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Address Line 1
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Street address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Address Line 2
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-[#878787] font-normal">
                      ZIP / Postal code
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Country
                  </FormLabel>
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
          </CardContent>

          <CardFooter className="flex justify-end">
            <SubmitButton
              isSubmitting={updateTeamMutation.isPending}
              disabled={updateTeamMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
